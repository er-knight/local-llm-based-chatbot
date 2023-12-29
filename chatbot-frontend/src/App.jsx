import { useEffect, useState } from 'react'

// eslint-disable-next-line react/prop-types
function Chat({ query, response, showLine }) {
  return (
    <>
      { showLine && <hr /> }
      <div className="flex w-full flex-col mt-1.5">
        <div className='flex pb-1'>
          <div className='rounded p-1 bg-slate-300 min-w-5 h-5 inline-flex justify-center'>
            <svg xmlns='http://www.w3.org/2000/svg' height='10' viewBox='0 0 448 512'><path d='M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512H418.3c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304H178.3z' fill='#334155' /></svg>
          </div>
          <p className="font-['DM_Sans'] text-xs pl-1 inline-flex items-center">{query}</p>
        </div>
        <div className='flex pb-1'> 
          <div className='rounded p-1 bg-slate-300 w-min h-5'>
            <svg xmlns='http://www.w3.org/2000/svg' height='10' viewBox='0 0 640 512'><path d='M320 0c17.7 0 32 14.3 32 32V96H472c39.8 0 72 32.2 72 72V440c0 39.8-32.2 72-72 72H168c-39.8 0-72-32.2-72-72V168c0-39.8 32.2-72 72-72H288V32c0-17.7 14.3-32 32-32zM208 384c-8.8 0-16 7.2-16 16s7.2 16 16 16h32c8.8 0 16-7.2 16-16s-7.2-16-16-16H208zm96 0c-8.8 0-16 7.2-16 16s7.2 16 16 16h32c8.8 0 16-7.2 16-16s-7.2-16-16-16H304zm96 0c-8.8 0-16 7.2-16 16s7.2 16 16 16h32c8.8 0 16-7.2 16-16s-7.2-16-16-16H400zM264 256a40 40 0 1 0 -80 0 40 40 0 1 0 80 0zm152 40a40 40 0 1 0 0-80 40 40 0 1 0 0 80zM48 224H64V416H48c-26.5 0-48-21.5-48-48V272c0-26.5 21.5-48 48-48zm544 0c26.5 0 48 21.5 48 48v96c0 26.5-21.5 48-48 48H576V224h16z' fill='#334155' /></svg>
          </div>
          <p className="font-['DM_Sans'] text-xs pl-1 inline-flex items-center">{response === '' ? <img src='src/assets/dots-loading.gif' width='20px' /> : response}</p>
        </div>
      </div>
    </>
  )
}

function App() {
  const [query, setQuery] = useState('')
  const [websocket, setWebsocket] = useState(null)
  const [chats, setChats] = useState([])
  const [chatType, setChatType] = useState(''); // sql or doc
  const [chatTypesVisible, setChatTypesVisible] = useState(true)

  useEffect(() => {
    const ws = new WebSocket(import.meta.env.VITE_WEBSOCKET_URL)
    
    ws.onopen = () => {
      setWebsocket(ws)
    }
    
    ws.onmessage = (event) => {
      setChats((prevChats) => [
        ...prevChats.slice(0, prevChats.length - 1), 
        { query: prevChats.at(prevChats.length - 1).query, response: event.data }
      ]
    )}

    return () => {
      if (websocket) {
        websocket.close()
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sendMessage = () => {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      setChats((prevChats) => [...prevChats, { query: query, response: '' }])
      websocket.send(JSON.stringify({query: query, chatType: chatType}))
      setQuery('')
    }
  }

  return (
    <div className='w-screen h-screen p-2 flex flex-col'>
      {
        chatTypesVisible
          ? <div className='flex w-full h-full items-center justify-center'>
              <button className="border-2 border-slate-300 rounded font-['DM_Sans'] p-1 w-24 h-24 mr-1 hover:bg-slate-300" onClick={
                () => {
                  setChatType('doc')
                  setChatTypesVisible(false)
                }
              }>Chat with Documents</button>
              <button className="border-2 border-slate-300 rounded font-['DM_Sans'] p-1 w-24 h-24 ml-1 hover:bg-slate-300" onClick={
                () => {
                  setChatType('sql')
                  setChatTypesVisible(false)
                }
              }>Chat with SQL Database</button>
            </div>
          : <div className='grow overflow-y-auto'>
              {
                chats.map((value, index) => {
                  return <Chat key={`chat-${index}`} query={value.query} response={value.response} showLine={index > 0}></Chat>
                })
              }
            </div>
      }
      <div className='flex items-center justify-between border-2 rounded p-1 mt-1 border-slate-300'>
        <textarea className="font-['DM_Sans'] text-xs outline-none grow mr-2 overflow-y-hidden resize-none bg-transparent disabled:cursor-not-allowed" id='query-input' rows='1' onInput={(event) => setQuery(event.target.value)} value={query} placeholder='Ask me something' onKeyDown={(event) => {
          if (!event.defaultPrevented && event.key === 'Enter') {
            event.target.blur() // clicking button removes focus, implemented same functionality here
            sendMessage()
          }
        }} disabled={chatType === '' ? true : false} ></textarea>
        <button className='rounded p-1 bg-slate-300 outline-none disabled:cursor-not-allowed' type='button' onClick={sendMessage} disabled={query === '' ? true : false}>
          <svg xmlns='http://www.w3.org/2000/svg' height='12' width='12' viewBox='0 0 512 512'><path d='M498.1 5.6c10.1 7 15.4 19.1 13.5 31.2l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6L284 427.7l-68.5 74.1c-8.9 9.7-22.9 12.9-35.2 8.1S160 493.2 160 480V396.4c0-4 1.5-7.8 4.2-10.7L331.8 202.8c5.8-6.3 5.6-16-.4-22s-15.7-6.4-22-.7L106 360.8 17.7 316.6C7.1 311.3 .3 300.7 0 288.9s5.9-22.8 16.1-28.7l448-256c10.7-6.1 23.9-5.5 34 1.4z' fill='#334155' />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default App
