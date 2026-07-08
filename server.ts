import express from "express";
import path from "path";
import fs from "fs/promises";
import { createServer as createViteServer } from "vite";
import { BoardState, DAYS } from "./src/types.js";

// Helper to ensure a directory exists
async function ensureDir(dirPath: string) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (err) {
    // Already exists or can't create
  }
}

const DATA_DIR = path.join(process.cwd(), "data");

// Generate a default board state
function createDefaultBoard(id: string): BoardState {
  return {
    id,
    name: "Meetup Organizer",
    description: "Manage participant slots, hours availability, and notes across all scheduled days.",
    isShared: false,
    columns: [
      {
        id: "participant",
        name: "Participant Name",
        type: "text",
      },
      {
        id: "status",
        name: "Attendance Status",
        type: "select",
        options: [
          { id: "opt-1", text: "Confirmed 🎉", bgColor: "#065f46", textColor: "#ecfdf5" },
          { id: "opt-2", text: "Interessé disponible 🤔", bgColor: "#854d0e", textColor: "#fef9c3" },
          { id: "opt-3", text: "Unavailable ❌", bgColor: "#991b1b", textColor: "#fef2f2" }
        ]
      },
      {
        id: "schedule",
        name: "Hour Availability",
        type: "schedule"
      },
      {
        id: "commentaire",
        name: "Commentaire",
        type: "text"
      }
    ],
    rows: [
      {
        id: "v-row-1",
        dayId: "vendredi",
        cells: {
          "participant": "Organizer",
          "status": "opt-1",
          "schedule": {
            "vendredi": {
              "08h00": "Confirmed",
              "09h00": "Confirmed",
              "10h00": "yes",
              "11h00": "yes",
              "12h00": "maybe",
              "13h00": "maybe",
              "14h00": ""
            }
          },
          "commentaire": "This is a comment with free wrapping text."
        }
      },
      {
        id: "v-row-rdv",
        dayId: "vendredi",
        cells: {
          "participant": "rdv devant parc expo",
          "status": "opt-1",
          "schedule": {
            "vendredi": {
              "08h00": "Confirmed",
              "09h00": "Confirmed",
              "10h00": "yes",
              "11h00": "yes",
              "12h00": "maybe",
              "13h00": "maybe",
              "14h00": ""
            }
          },
          "commentaire": "Rencontre principale devant l'entrée du salon."
        }
      },
      {
        id: "s-row-1",
        dayId: "samedi",
        cells: {
          "participant": "Alice Martin",
          "status": "opt-2",
          "schedule": {
            "samedi": {
              "08h00": "",
              "09h00": "maybe",
              "10h00": "yes",
              "11h00": "yes",
              "12h00": "Confirmed",
              "13h00": "Confirmed",
              "14h00": "maybe"
            }
          },
          "commentaire": ""
        }
      },
      {
        id: "d-row-1",
        dayId: "dimanche",
        cells: {
          "participant": "Bob Dubois",
          "status": "opt-3",
          "schedule": {},
          "commentaire": ""
        }
      }
    ]
  };
}

async function startServer() {
  await ensureDir(DATA_DIR);

  const app = express();
  const PORT = 3000;

  // Middleware for JSON parsing
  app.use(express.json());

  // API routes
  
  // Get board state
  app.get("/api/board/:id", async (req, res) => {
    const { id } = req.params;
    const filePath = path.join(DATA_DIR, `board_${id}.json`);
    
    try {
      const data = await fs.readFile(filePath, "utf-8");
      const board = JSON.parse(data) as BoardState;
      return res.json(board);
    } catch (error) {
      // Board does not exist, create and return default
      const defaultBoard = createDefaultBoard(id);
      await fs.writeFile(filePath, JSON.stringify(defaultBoard, null, 2), "utf-8");
      return res.json(defaultBoard);
    }
  });

  // Save/Update board state
  app.post("/api/board/:id", async (req, res) => {
    const { id } = req.params;
    const clientBoard = req.body as BoardState;
    const filePath = path.join(DATA_DIR, `board_${id}.json`);

    try {
      let existingBoard: BoardState | null = null;
      try {
        const data = await fs.readFile(filePath, "utf-8");
        existingBoard = JSON.parse(data) as BoardState;
      } catch (e) {
        // Doesn't exist, will create brand new
      }

      let boardToSave = { ...clientBoard, id };

      // Ensure isShared remains or is set, but do not override client's updated columns
      if (existingBoard && existingBoard.isShared) {
        boardToSave.isShared = true;
      }

      await fs.writeFile(filePath, JSON.stringify(boardToSave, null, 2), "utf-8");
      return res.json(boardToSave);
    } catch (err) {
      console.error("Error saving board:", err);
      return res.status(500).json({ error: "Failed to save board state." });
    }
  });

  // Mark board as shared/locked
  app.post("/api/board/:id/share", async (req, res) => {
    const { id } = req.params;
    const filePath = path.join(DATA_DIR, `board_${id}.json`);

    try {
      let board: BoardState;
      try {
        const data = await fs.readFile(filePath, "utf-8");
        board = JSON.parse(data) as BoardState;
      } catch (e) {
        board = createDefaultBoard(id);
      }

      board.isShared = true;
      await fs.writeFile(filePath, JSON.stringify(board, null, 2), "utf-8");
      return res.json(board);
    } catch (err) {
      console.error("Error sharing board:", err);
      return res.status(500).json({ error: "Failed to mark board as shared." });
    }
  });

  // Serve static files / Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
