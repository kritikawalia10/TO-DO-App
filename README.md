 # Todo React — Fullstack Todo App

 This repository contains a small fullstack Todo application: a Node-based server (API + data) and a React frontend built with Vite.

 ## Description

 A lightweight, educational Todo application demonstrating a fullstack workflow: a minimal Express API with JSON persistence and a Vite + React frontend. It's intended for learning CRUD, basic auth flows, real-time updates via sockets, and simple project structuring.

 ## Overview
 
 The project is split into two folders: the `server` exposes REST endpoints and lightweight persistence, while the `todolist` client implements the UI, authentication flows, and task management features. The repository is designed for easy local development and experimentation.

 Quick overview:
 - **Server:** lightweight Node/Express API using lowdb for simple JSON persistence (folder: `server`).
 - **Client:** React + Vite app (folder: `todolist`) with Tailwind/CSS for UI.

 Project structure (top-level):

 - `server/` — backend API, data, and scripts
 - `todolist/` — frontend (Vite + React)

 Features:
 - Create, read, update, delete tasks
 - User authentication (basic) and notifications (server-provided)

 Prerequisites:
 - Node.js (16+ recommended)

 Setup & run (dev):

 1. Install dependencies for server and client:

 ```bash
 cd server
 npm install

 cd ../todolist
 npm install
 ```

 2. Start the backend and frontend (run each in its own terminal):

 ```bash
 # From repository root — run server
 cd server
 npm run dev   # or `npm start` depending on package.json scripts

 # In a separate terminal, run client
 cd todolist
 npm run dev   # starts Vite dev server
 ```

 Notes:
 - The server uses `data/db.json` as its simple datastore. Do not commit secrets to this repo.
 - For production deployment, replace the lowdb adapter with a proper database.

 If you want, I can also:
 - Add environment variable instructions and example `.env.sample`
 - Update `package.json` scripts to unify `start`/`dev` commands

 Enjoy — open an issue or ask if you want CI or a Docker setup.


