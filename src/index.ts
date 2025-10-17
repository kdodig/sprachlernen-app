import express from "express"
import cors from "cors"
import dotenv from "dotenv"

dotenv.config()

const app = express()
const port = process.env.PORT ?? 3000

app.use(cors())
app.use(express.json())

app.get("/health", (_req, res) => {
  res.json({ ok: true })
})

app.post("/stt", (_req, res) => {
  res.status(501).json({ message: "STT endpoint not implemented yet" })
})

app.post("/chat", (_req, res) => {
  res.status(501).json({ message: "Chat endpoint not implemented yet" })
})

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on port ${port}`)
})
