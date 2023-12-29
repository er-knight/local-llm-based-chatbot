import json
import os

from dotenv import load_dotenv

from langchain.agents import create_sql_agent
from langchain.agents.agent_toolkits import SQLDatabaseToolkit
from langchain.agents.agent_types import AgentType
from langchain.llms.llamacpp import LlamaCpp
from langchain.sql_database import SQLDatabase
from langchain.callbacks.manager import CallbackManager
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler

from langchain.document_loaders import TextLoader
from langchain.embeddings.sentence_transformer import SentenceTransformerEmbeddings
from langchain.text_splitter import CharacterTextSplitter
from langchain.vectorstores.chroma import Chroma
from langchain import hub
from langchain.chains import RetrievalQA

load_dotenv()

callback_manager = CallbackManager([StreamingStdOutCallbackHandler()])

llm = LlamaCpp(
    model_path=os.environ.get('LLM_PATH'),
    temperature=0.1,
    n_ctx=4096,
    n_batch=512,
    callback_manager=callback_manager,
    f16_kv=True,
    verbose=False
)    

db = SQLDatabase.from_uri(f"postgresql+psycopg2://{os.environ.get('POSTGRES_USER')}:{os.environ.get('POSTGRES_PASSWORD')}@{os.environ.get('POSTGRES_HOST')}:{os.environ.get('POSTGRES_PORT')}/{os.environ.get('POSTGRES_DB')}")



def get_response_from_database(query: str):

    toolkit = SQLDatabaseToolkit(db=db, llm=llm)

    agent_executor = create_sql_agent(
        llm=llm,
        toolkit=toolkit,
        verbose=True,
        agent_type=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
    )

    return agent_executor.run(query)

def get_response_from_documents(query: str):

    loader = TextLoader(os.environ.get('DOCUMENT_PATH'))
    documents = loader.load()

    text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=0)
    docs = text_splitter.split_documents(documents)

    embedding_function = SentenceTransformerEmbeddings(model_name='all-MiniLM-L6-v2')

    db = Chroma.from_documents(docs, embedding_function, persist_directory='./chroma')
    
    rag_prompt_mistral = hub.pull('rlm/rag-prompt-mistral')

    qa_chain = RetrievalQA.from_chain_type(
        llm,
        retriever=db.as_retriever(),
        chain_type_kwargs={'prompt': rag_prompt_mistral},
    )
    response = qa_chain({'query': query})
    yield response.get('result', 'Could not retrieve response.')

async def get_response_from_chatbot(query: str):
    query = json.loads(query)
    if query.get('chatType') == 'doc':
        yield get_response_from_documents(query['query'])
    elif query.get('chatType') == 'sql':
        yield get_response_from_database(query['query'])
    else:
        yield 'Invalid chatType!'
    