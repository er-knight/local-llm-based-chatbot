from fastapi import FastAPI, WebSocket, WebSocketDisconnect

from utils import get_response_from_chatbot

app = FastAPI()

@app.websocket('/chat')
async def chat(websocket: WebSocket):
    await websocket.accept()
    try:
        async for message in websocket.iter_text():
            async for response in get_response_from_chatbot(message):
                await websocket.send_text(response)
    except WebSocketDisconnect:
        pass
