import os
import PyPDF2
from typing import TypedDict, Annotated, Sequence, Optional, Literal, List, Tuple
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from dotenv import load_dotenv
import gradio as gr

# Cargar variables de entorno
load_dotenv()

# --- Configuración del LLM (Ejemplo con OpenAI) ---
try:
    # Asegúrate de tener la variable de entorno OPENAI_API_KEY configurada
    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        raise ValueError("La variable de entorno OPENAI_API_KEY no está configurada.")
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0, openai_api_key=openai_api_key)
    # Pequeña prueba para asegurar que el LLM está accesible
    llm.invoke("Hola") 
except Exception as e:
    print(f"Error al inicializar ChatOpenAI: {e}")
    print("Por favor, asegúrate de tener tu OPENAI_API_KEY configurada en un archivo .env")
    print("El chatbot podría no funcionar correctamente sin un LLM.")
    llm = None 

# --- Extracción de Texto de PDF ---
def extract_pdf_text(pdf_path: str) -> str:
    """Extrae texto de un archivo PDF."""
    if not os.path.exists(pdf_path):
        return "Error: Archivo PDF no encontrado."
    try:
        with open(pdf_path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            if reader.is_encrypted:
                try:
                    reader.decrypt("") # Intenta con contraseña vacía
                except Exception as e_decrypt:
                    return f"Error: El PDF está encriptado y no se pudo desencriptar. {e_decrypt}"
            text = ""
            for page_num in range(len(reader.pages)):
                page = reader.pages[page_num]
                extracted_page_text = page.extract_text()
                if extracted_page_text:
                    text += extracted_page_text
            return text if text.strip() else "No se pudo extraer texto del PDF (puede estar vacío o ser una imagen)."
    except Exception as e:
        return f"Error al leer el PDF: {e}"

# --- Estado del Grafo ---
class ChatState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], lambda x, y: x + y if y else x]
    pdf_text: Optional[str]
    user_input: Optional[str]
    pdf_file_path: Optional[str] 
    current_pdf_filename: Optional[str] # Para mostrar en la UI y controlar reprocesamiento
    # No necesitamos is_pdf_processed_for_current_file, podemos comparar current_pdf_filename con el nuevo.

# --- Nodos del Grafo ---
def input_node(state: ChatState) -> ChatState:
    """Prepara la entrada para los siguientes nodos."""
    # El user_input y pdf_file_path son establecidos por la función de Gradio antes de invocar
    return {
        "user_input": state.get("user_input"),
        "pdf_file_path": state.get("pdf_file_path"),
        "current_pdf_filename": state.get("current_pdf_filename"),
        "messages": [] 
    }

def pdf_processing_node(state: ChatState) -> ChatState:
    """Procesa el PDF si se proporciona una nueva ruta."""
    pdf_path = state.get("pdf_file_path")
    new_pdf_filename = os.path.basename(pdf_path) if pdf_path else None
    
    # Procesar solo si hay un path y (no hay filename previo O el filename es diferente)
    if pdf_path and (not state.get("current_pdf_filename") or state.get("current_pdf_filename") != new_pdf_filename):
        print(f"Procesando PDF: {pdf_path}...")
        extracted_text = extract_pdf_text(pdf_path)
        
        system_message_content = f"Se ha procesado el PDF: {new_pdf_filename}. "
        if "Error" in extracted_text or not extracted_text.strip():
            system_message_content += f"Problema: {extracted_text}"
            print(f"Problema al procesar PDF: {extracted_text}")
            return {
                "pdf_text": None, 
                "messages": [SystemMessage(content=system_message_content)],
                "current_pdf_filename": new_pdf_filename, # Guardar el nombre del PDF procesado (o intentado)
            }
        else:
            system_message_content += "Contenido disponible para consulta."
            print("PDF procesado exitosamente.")
            return {
                "pdf_text": extracted_text,
                "messages": [SystemMessage(content=system_message_content)],
                "current_pdf_filename": new_pdf_filename,
            }
    # Si el PDF es el mismo que ya se procesó, o no hay PDF, no hacer nada.
    return {"messages": []} 

def agent_node(state: ChatState) -> ChatState:
    """Genera una respuesta usando el LLM, historial y texto del PDF."""
    user_input = state.get("user_input")
    if not user_input:
        return {"messages": []}

    print("Agente generando respuesta...")
    # Los mensajes ya incluyen el SystemMessage del PDF si se procesó en el nodo anterior.
    # O el historial de mensajes de interacciones previas.
    history_messages = state.get("messages", []) 
    pdf_text = state.get("pdf_text")

    # Crear el prompt
    prompt_template_messages = [
        SystemMessage(content="Eres un asistente IA conversacional. Responde las preguntas del usuario de forma concisa. Si hay un PDF cargado y relevante, usa su contenido. Si no estás seguro, dilo."),
        MessagesPlaceholder(variable_name="history")
    ]
    
    # Construir el contexto del PDF para el LLM
    pdf_context_for_llm = ""
    if pdf_text:
        pdf_context_for_llm = f"Contexto del PDF '{state.get('current_pdf_filename', 'actual')}':\\n{pdf_text[:2000]}... (contenido truncado si es largo)\\n---"
        # Insertar el contexto del PDF después del system prompt y antes del historial real,
        # o directamente antes del HumanMessage si se prefiere una atención más inmediata.
        # Aquí lo añadimos como un SystemMessage más.
        prompt_template_messages.insert(1, SystemMessage(content=pdf_context_for_llm))

    prompt_template_messages.append(HumanMessage(content=user_input))
    prompt = ChatPromptTemplate.from_messages(prompt_template_messages)
    
    if not llm: # Si el LLM no se pudo inicializar
        ai_response_content = "Error: El modelo de lenguaje no está disponible. Por favor, verifica la configuración de OpenAI."
    else:
        chain = prompt | llm | StrOutputParser()
        try:
            # El historial para el LLM debería ser los mensajes *acumulados en el estado global*,
            # excluyendo el último system message de procesamiento de PDF si solo fue informativo y no conversacional.
            # Y el input del usuario ya está en el prompt.
            
            # Tomamos todos los mensajes actuales de ChatState que no sean el SystemMessage de procesamiento de PDF de esta misma ronda.
            # El acumulador lambda en ChatState.messages se encarga de esto.
            ai_response_content = chain.invoke({"history": history_messages})
            print(f"Respuesta del LLM: {ai_response_content}")
        except Exception as e:
            print(f"Error al invocar el LLM: {e}")
            ai_response_content = "Lo siento, tuve un problema al generar la respuesta. Verifica que OpenAI esté funcionando."

    # El mensaje del usuario ya debería estar en `state['messages']` gracias al acumulador.
    # Solo necesitamos añadir la respuesta del AI.
    # Sin embargo, la forma en que Gradio maneja el estado y las invocaciones sucesivas significa
    # que es mejor que el nodo agent_node devuelva el par user/AI.
    # Gradio state acumulará.
    
    # Devolvemos el mensaje humano y el mensaje AI para que se añadan al historial en la UI
    return_messages = [HumanMessage(content=user_input), AIMessage(content=ai_response_content)]
    
    return {"messages": return_messages, "user_input": None} # Limpiar user_input

# --- Lógica Condicional del Grafo ---
def should_process_pdf(state: ChatState) -> Literal["process_pdf", "agent"]:
    pdf_path = state.get("pdf_file_path")
    new_pdf_filename = os.path.basename(pdf_path) if pdf_path else None
    
    # Procesar si hay un path y (no hay filename previo O el filename es diferente)
    if pdf_path and (not state.get("current_pdf_filename") or state.get("current_pdf_filename") != new_pdf_filename):
        print(f"Decisión: Procesar PDF ({new_pdf_filename})")
        return "process_pdf"
    
    # Si no hay PDF o es el mismo, y hay entrada de usuario, ir al agente.
    if state.get("user_input"):
        print("Decisión: Ir al agente (PDF ya procesado o sin PDF, con entrada de usuario)")
        return "agent"
    
    # Si no hay PDF nuevo Y no hay entrada de usuario (ej. solo se subió un PDF ya procesado sin nuevo texto)
    # podríamos querer terminar o tener un nodo de "espera". Por ahora, si no hay user_input, el agente no hará mucho.
    # O si solo se subió un PDF, el pdf_processing_node ya habrá añadido un SystemMessage.
    # Si la condición lleva a un nodo que no espera user_input, asegurarse que maneje el None.
    print("Decisión: Ir al agente (caso por defecto, o solo PDF sin nuevo input)")
    return "agent" # Por defecto, o si solo se cargó PDF y ya se procesó.

# --- Construcción del Grafo ---
workflow = StateGraph(ChatState)
workflow.add_node("input_handler", input_node) # Renombrado para claridad
workflow.add_node("pdf_processor", pdf_processing_node)
workflow.add_node("agent", agent_node)

workflow.set_entry_point("input_handler")
workflow.add_conditional_edges(
    "input_handler",
    should_process_pdf,
    {
        "process_pdf": "pdf_processor",
        "agent": "agent", # Si no hay PDF nuevo, va directo al agente si hay user_input
    }
)
# Si se procesó un PDF, el resultado (incluyendo SystemMessage) va al agente para posible uso o si hay user_input también
workflow.add_edge("pdf_processor", "agent") 
workflow.add_edge("agent", END)

app = workflow.compile()

# --- Lógica de Interfaz con Gradio ---
def convert_messages_to_gradio_chat(messages: Sequence[BaseMessage]) -> List[Tuple[Optional[str], Optional[str]]]:
    """Convierte la lista de BaseMessage a formato de chat de Gradio."""
    chat_history = []
    for msg in messages:
        if isinstance(msg, HumanMessage):
            chat_history.append((msg.content, None))
        elif isinstance(msg, AIMessage):
            if chat_history and chat_history[-1][1] is None: # Si el último fue humano
                 chat_history[-1] = (chat_history[-1][0], msg.content)
            else: # Mensaje de IA sin un humano precedente directo (ej. saludo inicial)
                chat_history.append((None, msg.content))
        elif isinstance(msg, SystemMessage): # Mostrar mensajes del sistema
            chat_history.append((None, f"[SYSTEM] {msg.content}"))
    return chat_history

def chat_interface_fn(user_message: str, chat_history_tuples: List[Tuple[Optional[str], Optional[str]]], pdf_file_obj: Optional[gr.File], chat_state_dict: dict):
    """Función principal para la interfaz de Gradio."""
    
    # Reconstruir el estado de ChatState desde el diccionario de estado de Gradio
    # y el historial de tuplas.
    # El historial de tuplas es solo para visualización, la fuente de verdad son los BaseMessages.
    
    current_messages = chat_state_dict.get("messages", [])
    current_pdf_text = chat_state_dict.get("pdf_text")
    current_pdf_filename_in_state = chat_state_dict.get("current_pdf_filename")

    input_for_graph = {
        "messages": current_messages, # Historial acumulado de BaseMessage
        "pdf_text": current_pdf_text,
        "user_input": user_message if user_message and user_message.strip() else None,
        "pdf_file_path": pdf_file_obj.name if pdf_file_obj else None,
        "current_pdf_filename": current_pdf_filename_in_state
    }
    
    # Si se carga un nuevo archivo PDF, actualizamos el current_pdf_filename_in_state para la lógica de should_process_pdf
    # Esta lógica está ahora dentro de should_process_pdf y pdf_processing_node
    # input_for_graph[\"current_pdf_filename\"] se actualizará si es un nuevo PDF.

    # Invocamos el grafo LangGraph
    result_state = app.invoke(input_for_graph)

    # Actualizar el estado persistente de Gradio
    updated_chat_state_dict = {
        "messages": result_state.get("messages", current_messages), # messages se acumulan por la lambda
        "pdf_text": result_state.get("pdf_text", current_pdf_text),
        "current_pdf_filename": result_state.get("current_pdf_filename", current_pdf_filename_in_state)
    }
    
    # Convertir mensajes para mostrar en Gradio
    # El result_state[\"messages\"] contiene los mensajes de ESTA ejecución (ej. user + AI, o system)
    # Necesitamos todo el historial acumulado.
    gradio_chat_display = convert_messages_to_gradio_chat(updated_chat_state_dict["messages"])

    # Limpiar el cuadro de texto y el campo de archivo PDF
    return gradio_chat_display, None, None, updated_chat_state_dict

# --- Montaje de la Interfaz Gradio ---
with gr.Blocks(theme=gr.themes.Soft()) as demo:
    gr.Markdown("""# Chatbot con LangGraph, PDF y Memoria
    Chatea con el asistente. Puedes subir un archivo PDF para que el chatbot lo utilice como contexto.
    Asegúrate de tener OpenAI (u otro LLM configurado) ejecutándose si deseas respuestas generadas por IA.
    """)

    # Estado persistente de la conversación para Gradio
    # Contendrá el ChatState como un diccionario
    chat_state_gr = gr.State({
        "messages": [], 
        "pdf_text": None, 
        "current_pdf_filename": None
    })

    chatbot_display = gr.Chatbot(
        label="Conversación", 
        bubble_full_width=False,
        height=600
    )
    
    with gr.Row():
        pdf_upload = gr.File(label="Cargar PDF", file_types=[".pdf"])
    
    with gr.Row():
        user_textbox = gr.Textbox(
            show_label=False,
            placeholder="Escribe tu mensaje o sube un PDF y luego pregunta...",
            container=False,
            scale=7,
        )
        submit_button = gr.Button("Enviar", variant="primary", scale=1)

    # Acciones
    submit_button.click(
        chat_interface_fn,
        inputs=[user_textbox, chatbot_display, pdf_upload, chat_state_gr],
        outputs=[chatbot_display, user_textbox, pdf_upload, chat_state_gr]
    )
    user_textbox.submit(
        chat_interface_fn,
        inputs=[user_textbox, chatbot_display, pdf_upload, chat_state_gr],
        outputs=[chatbot_display, user_textbox, pdf_upload, chat_state_gr]
    )
    # Cuando se sube un PDF, también queremos que se pueda "enviar" (quizás con un mensaje vacío)
    # para que se procese si no hay texto.
    pdf_upload.upload(
         chat_interface_fn,
         inputs=[user_textbox, chatbot_display, pdf_upload, chat_state_gr], # user_textbox puede estar vacío
         outputs=[chatbot_display, user_textbox, pdf_upload, chat_state_gr]
    )


if __name__ == "__main__":
    if not llm:
        print("ADVERTENCIA: El LLM (OpenAI) no se cargó correctamente. Verifica tu OPENAI_API_KEY.")
    print("Iniciando interfaz de Gradio...")
    demo.launch() 