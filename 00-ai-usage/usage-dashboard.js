import React, { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Sector } from 'recharts';
import WordCloud from 'react-wordcloud';
import { rawCommentsData, stopWords } from './data';

// Helper function to process data
const processData = (rawComments) => {
  // --- Data from Text Comments (Qualitative) ---
  const comments = rawComments
    .toLowerCase()
    .split(/\n|\|/)
    .map(comment => comment.trim())
    .filter(comment => comment.length > 2);

  let benefits = { 'Increased Speed': 0, 'Improved Quality': 0, 'Easier Work': 0, 'Learning & Understanding': 0, 'New Focus/Strategy': 0, 'Automation': 0 };
  let textualConcerns = { 'Licensing (Cost/Access)': 0, 'Client Approval/Needs': 0, 'Security & Legal': 0, 'Integration Issues': 0, 'Training/Knowledge Gap': 0, 'Perceived Low Value/No Need': 0 };
  let wordFrequency = {};
  let qualitativeConcernsList = new Set();

  const positiveKeywords = {
    'speed': 'Increased Speed', 'fast': 'Increased Speed', 'rápida': 'Increased Speed', 'tiempo': 'Increased Speed', 'agiliza': 'Increased Speed',
    'quality': 'Improved Quality', 'mejor calidad': 'Improved Quality', 'best code': 'Improved Quality', 'better solutions': 'Improved Quality',
    'easy': 'Easier Work', 'fácil': 'Easier Work', 'sencillo': 'Easier Work', 'intuitive': 'Easier Work',
    'learn': 'Learning & Understanding', 'aprender': 'Learning & Understanding', 'entender': 'Learning & Understanding', 'conocimiento': 'Learning & Understanding',
    'focus': 'New Focus/Strategy', 'strategic': 'New Focus/Strategy', 'creatividad': 'New Focus/Strategy', 'problem solving': 'New Focus/Strategy',
    'automate': 'Automation', 'automatización': 'Automation',
    'ayuda': 'Easier Work', 'help': 'Easier Work', 'assistance': 'Easier Work'
  };

  const concernKeywords = {
    'license': 'Licensing (Cost/Access)', 'licencia': 'Licensing (Cost/Access)', 'costly': 'Licensing (Cost/Access)', 'paid': 'Licensing (Cost/Access)',
    'client': 'Client Approval/Needs', 'cliente': 'Client Approval/Needs', 'approval': 'Client Approval/Needs',
    'legal': 'Security & Legal', 'security': 'Security & Legal', 'confidential': 'Security & Legal', 'zscaler': 'Security & Legal', 'sensitive data': 'Security & Legal',
    'integrate': 'Integration Issues', 'troublesome': 'Integration Issues', 'bad code': 'Integration Issues',
    'training': 'Training/Knowledge Gap', 'understand ai': 'Training/Knowledge Gap', 'know how': 'Training/Knowledge Gap', 'prompt': 'Training/Knowledge Gap',
    'no need': 'Perceived Low Value/No Need', 'not required': 'Perceived Low Value/No Need', 'simple problem': 'Perceived Low Value/No Need', 'not using': 'Perceived Low Value/No Need'
  };

  const translateToEnglish = (word) => {
    const translations = {
      'codigo': 'code', 'desarrollo': 'development', 'herramienta': 'tool', 'herramientas': 'tools',
      'rapido': 'fast', 'velocidad': 'speed', 'calidad': 'quality', 'mejor': 'better', 'facil': 'easy',
      'adaptacion': 'adaptation', 'ayudar': 'help', 'cuestiones': 'issues', 'problema': 'problem',
      'solucion': 'solution', 'necesario': 'necessary', 'necesitas': 'need', 'conocimiento': 'knowledge',
      'habilidad': 'skill', 'interpretar': 'interpret', 'comunicarnos': 'communicate', 'tiempo': 'time',
      'esfuerzo': 'effort', 'tarea': 'task', 'asistencia': 'assistance', 'optimizacion': 'optimization',
      'automatizacion': 'automation', 'procesos': 'processes', 'estrategicas': 'strategic', 'contexto': 'context',
      'comprension': 'comprehension', 'escribir': 'write', 'requiere': 'requires', 'evolucionando': 'evolving',
      'ambitos': 'areas', 'manual': 'manual', 'crucial': 'crucial', 'bases': 'foundations', 'solidas': 'solid',
      'profundo': 'deep', 'aprovechar': 'leverage', 'maximo': 'maximum', 'formacion': 'training', 'adecuada': 'adequate',
      'errores': 'errors', 'significativos': 'significant', 'autocompletar': 'autocomplete', 'metodos': 'methods',
      'genera': 'generates', 'corregir': 'correct', 'ganar': 'gain', 'eficiente': 'efficient', 'apresurado': 'hasty',
      'intuitivo': 'intuitive', 'agiliza': 'streamlines', 'codificacion': 'coding', 'permite': 'allows',
      'introducir': 'introduce', 'nulos': 'null', 'programacion': 'programming', 'quita': 'removes',
      'creatividad': 'creativity', 'realizar': 'perform', 'implementaciones': 'implementations', 'resolver': 'solve',
      'licencia': 'license', 'licencias': 'licenses', 'cliente': 'client', 'aprobacion': 'approval', 'seguridad': 'security',
      'costo': 'cost', 'integracion': 'integration', 'aprendizaje': 'learning', 'equipo': 'team', 'proyecto': 'project',
      'informacion': 'information', 'documentacion': 'documentation', 'marco': 'framework', 'datos': 'data',
      'confidencial': 'confidential', 'valor': 'value', 'escenarios': 'scenarios', 'pruebas': 'tests',
      'visualizar': 'visualize', 'oportunidad': 'opportunity', 'personal': 'personal', 'mejorar': 'improve',
      'comunicacion': 'communication', 'articular': 'articulate', 'casos': 'cases', 'uso': 'use',
      'recursos': 'resources', 'necesidades': 'needs', 'entender': 'understand', 'legal': 'legal',
      'unidad': 'unit', 'pruebas': 'testing', 'desarrollos': 'developments', 'analizaba': 'analyzed',
      'sugerencias': 'suggestions', 'entiendo': 'understand', 'ayudo': 'helped', 'depurar': 'debug',
      'variable': 'variable', 'depende': 'depends', 'saber': 'know', 'realmente': 'really',
      'integrando': 'integrating', 'afirmacion': 'statement', 'aristas': 'edges', 'modificaciones': 'modifications',
      'linea': 'line', 'aumentando': 'increasing', 'notablemente': 'notably', 'tecnico': 'technical',
      'resolver': 'solve', 'dificil': 'difficult', 'cambio': 'change', 'muchisimo': 'greatly',
      'tipos': 'types', 'trabajos': 'jobs', 'reduce': 'reduces', 'necesario': 'necessary',
      'cualquier': 'any', 'llegada': 'arrival', 'reemplazarlos': 'replace them', 'evolucionado': 'evolved',
      'nuevas': 'new', 'formas': 'ways', 'enfocarnos': 'focus', 'tareas': 'tasks',
      'comprende': 'understands', 'gustaria': 'would like', 'debemos': 'we must', 'escribe': 'writes',
      'seguir': 'continue', 'siendo': 'being', 'nuestra': 'our', 'momento': 'moment', 'proyectando': 'planning',
      'solo': 'only', 'casi': 'almost', 'todos': 'all', 'dedicar': 'dedicate', 'escritura': 'writing',
      'software': 'software', 'podria': 'could', 'contener': 'contain', 'ayuda': 'help',
      'comentario': 'comment', 'aceptaable': 'acceptable', 'desarrolladores': 'developers', 'pronto': 'soon',
      'viendo': 'seeing', 'excelente': 'excellent', 'permite': 'allows', 'menos': 'less',
      'acuerdo': 'agree', 'permite': 'allows', 'gente': 'people', 'nulos': 'nulls', 'programación': 'programming',
      'vez': 'time', 'esfuerzo': 'effort', 'enfocarnos': 'focus', 'creatividad': 'creativity',
      'hora': 'time', 'realizar': 'perform', 'implementaciones': 'implementations', 'resolver': 'solve',
      'problemas': 'problems'
    };
    return translations[word] || word;
  };

  comments.forEach(comment => {
    let commentLower = comment.toLowerCase();
    for (const keyword in positiveKeywords) {
      if (commentLower.includes(keyword)) benefits[positiveKeywords[keyword]]++;
    }
    for (const keyword in concernKeywords) {
      if (commentLower.includes(keyword)) {
        textualConcerns[concernKeywords[keyword]]++;
        if (concernKeywords[keyword] === 'Licensing (Cost/Access)' && (commentLower.includes('license') || commentLower.includes('licencia'))) {
          qualitativeConcernsList.add("Need for licenses (Copilot, Cursor, etc.) 📜");
        }
        if (concernKeywords[keyword] === 'Client Approval/Needs' && (commentLower.includes('client') || commentLower.includes('cliente') || commentLower.includes('approval'))) {
          qualitativeConcernsList.add("Client approval / alignment on AI usage is crucial 🤝");
        }
        if (concernKeywords[keyword] === 'Security & Legal' && (commentLower.includes('security') || commentLower.includes('legal') || commentLower.includes('confidential'))) {
          qualitativeConcernsList.add("Concerns about data security, confidentiality, and legal aspects 🛡️");
        }
        if (concernKeywords[keyword] === 'Integration Issues' && (commentLower.includes('integrate') || commentLower.includes('bad code'))) {
          qualitativeConcernsList.add("Difficulty integrating AI with existing 'bad code' or frameworks 🔗");
        }
        if (concernKeywords[keyword] === 'Training/Knowledge Gap' && (commentLower.includes('training') || commentLower.includes('understand') || commentLower.includes('learn'))) {
          qualitativeConcernsList.add("Need for better understanding and training on AI tools and prompting 🎓");
        }
      }
    }
    commentLower.split(/\s+/).forEach(word => {
      const cleanedWord = word.replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ").trim();
      const translatedWord = translateToEnglish(cleanedWord);
      if (translatedWord && translatedWord.length > 3 && !stopWords.has(translatedWord) && isNaN(translatedWord)) {
        wordFrequency[translatedWord] = (wordFrequency[translatedWord] || 0) + 1;
      }
    });
  });

  if (qualitativeConcernsList.size === 0) {
      if (textualConcerns['Perceived Low Value/No Need'] > 0) qualitativeConcernsList.add("Some feel AI is not needed for their current tasks or simple problems 🤔");
      if (comments.some(c => c.includes("prefer to read documentation"))) qualitativeConcernsList.add("Preference for traditional methods like reading documentation 📚");
  }
  const sortedWordFrequency = Object.entries(wordFrequency).sort(([,a],[,b]) => b-a).slice(0, 20);

  // --- Data from Survey (Quantitative) ---
  const toolUsageData = { // 65 responses
    'ChatGPT': 58,
    'GitHub Copilot': 32, // "Copilot" in image
    'Claude': 18,
    'Gemini': 14,
    'DeepSeek': 13,
    'Cursor': 12, // 9 from "AI Powered IDE (Cursor)" + 3 from "Cursor"
    'Other AI Tools': 25 // Sum of: Grok(1), Llama(1), NotebookLM(3), Make/n8n/PowerAutomate(2), TabNine(3), OpenAI API(4), Figma/Adobe(5), Vercel v0/Bolt(5), Cody/Codium(1)
  };
  // Note: 1 response was "None" for tools, 65 total responses for this question. Active users = 64.

  const aiReliabilityData = [ // 68 responses
    { rating: '1 (Low)', count: 2, percentage: 2.9 },
    { rating: '2', count: 2, percentage: 2.9 },
    { rating: '3 (Medium)', count: 32, percentage: 47.1 },
    { rating: '4', count: 26, percentage: 38.2 },
    { rating: '5 (High)', count: 6, percentage: 8.8 },
  ];

  const timeSavedData = [ // 68 responses
    { hours: '0', count: 7, percentage: 10.3 },
    { hours: '1', count: 11, percentage: 16.2 },
    { hours: '2', count: 24, percentage: 35.3 },
    { hours: '3', count: 18, percentage: 26.5 },
    { hours: '4', count: 3, percentage: 4.4 },
    { hours: '5', count: 3, percentage: 4.4 },
    { hours: '6', count: 0, percentage: 0.0 },
    { hours: '7', count: 1, percentage: 1.5 },
    { hours: '8+', count: 1, percentage: 1.5 }, // "8" in image, assuming 8+
  ];

  const aiUseCasesData = [ // 65 responses
    { useCase: 'Code Assistance', count: 47, percentage: 72.3 },
    { useCase: 'Testing & QA', count: 28, percentage: 43.1 },
    { useCase: 'Refactor Code', count: 27, percentage: 41.5 },
    { useCase: 'Unit Testing', count: 26, percentage: 40.0 },
    { useCase: 'Code Documentation', count: 21, percentage: 32.3 },
    { useCase: 'Automation (Repetitive Tasks)', count: 20, percentage: 30.8 },
    { useCase: 'Document Gen/Analysis', count: 20, percentage: 30.8 },
    { useCase: 'Code Review', count: 17, percentage: 26.2 },
    { useCase: 'Code Performance', count: 14, percentage: 21.5 },
    { useCase: 'Data Analysis', count: 12, percentage: 18.5 },
    { useCase: 'Design', count: 8, percentage: 12.3 },
    { useCase: 'Security/Vulnerabilities', count: 8, percentage: 12.3 },
    { useCase: 'Figma to Code', count: 5, percentage: 7.7 },
  ];
  
  const activeUsers = 64; // From "What AI Tools are you currently using?" (65 responses - 1 "None")
  const totalRespondents = 79; // Updated: Combined survey sources (79 total respondents)

  // --- Add new survey Likert data (from images) ---
  const aiUsageFrequencyData = [
    { label: '1', count: 3, percentage: 4.4 },
    { label: '2', count: 10, percentage: 14.7 },
    { label: '3', count: 20, percentage: 29.4 },
    { label: '4', count: 22, percentage: 32.4 },
    { label: '5', count: 13, percentage: 19.1 },
  ];
  const aiReliabilityLikertData = [
    { label: '1', count: 2, percentage: 2.9 },
    { label: '2', count: 2, percentage: 2.9 },
    { label: '3', count: 32, percentage: 47.1 },
    { label: '4', count: 26, percentage: 38.2 },
    { label: '5', count: 6, percentage: 8.8 },
  ];
  const aiTimeSavedLikertData = [
    { label: '0', count: 7, percentage: 10.3 },
    { label: '1', count: 11, percentage: 16.2 },
    { label: '2', count: 24, percentage: 35.3 },
    { label: '3', count: 18, percentage: 26.5 },
    { label: '4', count: 3, percentage: 4.4 },
    { label: '5', count: 3, percentage: 4.4 },
    { label: '7', count: 1, percentage: 1.5 },
    { label: '8+', count: 1, percentage: 1.5 },
  ];

  return {
    toolCounts: toolUsageData,
    benefits,
    textualConcerns, // Renamed to avoid conflict if we add survey-based concerns
    sortedWordFrequency,
    qualitativeConcernsList: Array.from(qualitativeConcernsList),
    activeUsers,
    totalRespondents,
    aiReliabilityData,
    timeSavedData,
    aiUseCasesData,
    rawCommentCount: comments.length,
    aiUsageFrequencyData,
    aiReliabilityLikertData,
    aiTimeSavedLikertData
  };
};


const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82Ca9D', '#FF7F50', '#AF19FF', '#FF4500', '#32CD32'];
const BG_COLOR_DARK_SURFACE = '#1e293b'; // slate-800
const TEXT_COLOR_MUTED = '#94a3b8'; // slate-400
const TEXT_COLOR_DEFAULT = '#e2e8f0'; // slate-200


const renderActiveShape = (props) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="text-sm font-semibold">
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill={TEXT_COLOR_DEFAULT} className="text-xs">{`${value} mentions`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill={TEXT_COLOR_MUTED} className="text-xs">
        {`(Rate ${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};


const App = () => {
  const [data, setData] = useState(null);
  const [activeIndexPie, setActiveIndexPie] = useState(0);

  // Raw comments from the user - this remains for qualitative analysis
  const rawCommentsInput = rawCommentsData;

  useEffect(() => {
    setData(processData(rawCommentsInput));
  }, [rawCommentsInput]);

  const onPieEnter = (_, index) => {
    setActiveIndexPie(index);
  };

  if (!data) {
    return <div className="p-8 text-center text-xl text-slate-300">Loading Dashboard Data... ⏳</div>;
  }

  const toolDataForChart = Object.entries(data.toolCounts).map(([name, users]) => ({ name, users })).filter(d => d.users > 0).sort((a,b) => b.users - a.users);
  const benefitDataForChart = Object.entries(data.benefits).map(([name, value]) => ({ name, value })).filter(d => d.value > 0).sort((a,b) => b.value - a.value);
  const textualConcernDataForChart = Object.entries(data.textualConcerns).map(([name, count]) => ({ name, count })).filter(d => d.count > 0).sort((a,b) => b.count - a.count);
  
  const topTool = toolDataForChart.length > 0 ? toolDataForChart[0].name : 'N/A';
  const biggestTextualConcern = textualConcernDataForChart.length > 0 ? textualConcernDataForChart[0].name : 'N/A';
  const averageTimeSaved = data.timeSavedData.reduce((acc, curr) => acc + (parseFloat(curr.hours.replace('+', '')) * curr.count), 0) / data.timeSavedData.reduce((acc, curr) => acc + curr.count, 0);


  const chartTooltipProps = {
    contentStyle: { backgroundColor: BG_COLOR_DARK_SURFACE, border: '1px solid #334155', borderRadius: '0.5rem' },
    itemStyle: { color: TEXT_COLOR_DEFAULT },
    cursor: { fill: 'rgba(255,255,255,0.1)'}
  };
  const chartAxisTickProps = { fill: TEXT_COLOR_MUTED, className:"text-xs sm:text-sm" };
  const chartLegendProps = { wrapperStyle: { color: TEXT_COLOR_DEFAULT, paddingTop: '10px' } };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 sm:p-6 md:p-8 text-gray-100 font-sans">
      <header className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
          AI Usage Dashboard @ Nybble Group 🚀
        </h1>
        <p className="text-sm text-slate-400 mt-1">Data as of March 2025</p>
        <p className="text-lg sm:text-xl text-slate-300 mt-2">Hackathon Edition - Insights from the Team! 🤖💡 (79 Survey Respondents)</p>
      </header>

      {/* --- NEW: Survey Likert Section --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {/* Frequency of AI Tool Usage */}
        <div className="bg-slate-800/70 p-5 rounded-xl shadow-xl flex flex-col justify-between">
          <h3 className="text-lg font-semibold text-sky-300 mb-4 text-center">How often do you use AI tools on a regular day?</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.aiUsageFrequencyData} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
              <XAxis type="number" tick={chartAxisTickProps}/>
              <YAxis dataKey="label" type="category" width={30} tick={chartAxisTickProps}/>
              <Tooltip {...chartTooltipProps} formatter={(value, name, props) => [`${value} (${props.payload.percentage}%)`, "Respondents"]}/>
              <Bar dataKey="count" name="Respondents" fill={COLORS[0]} radius={[0, 5, 5, 0]} >
                {data.aiUsageFrequencyData.map((entry, index) => (
                  <Cell key={`cell-freq-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Reliability of AI Tools */}
        <div className="bg-slate-800/70 p-5 rounded-xl shadow-xl flex flex-col justify-between">
          <h3 className="text-lg font-semibold text-cyan-300 mb-4 text-center">How reliable do you think AI tools are?</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.aiReliabilityLikertData} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
              <XAxis type="number" tick={chartAxisTickProps}/>
              <YAxis dataKey="label" type="category" width={30} tick={chartAxisTickProps}/>
              <Tooltip {...chartTooltipProps} formatter={(value, name, props) => [`${value} (${props.payload.percentage}%)`, "Respondents"]}/>
              <Bar dataKey="count" name="Respondents" fill={COLORS[6]} radius={[0, 5, 5, 0]} >
                {data.aiReliabilityLikertData.map((entry, index) => (
                  <Cell key={`cell-rel-${index}`} fill={COLORS[(index+2) % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {/* Time Saved by AI Tools */}
        <div className="bg-slate-800/70 p-5 rounded-xl shadow-xl flex flex-col justify-between">
          <h3 className="text-lg font-semibold text-lime-300 mb-4 text-center">How many hours a day do you save by using AI tools?</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.aiTimeSavedLikertData} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
              <XAxis type="number" tick={chartAxisTickProps}/>
              <YAxis dataKey="label" type="category" width={30} tick={chartAxisTickProps}/>
              <Tooltip {...chartTooltipProps} formatter={(value, name, props) => [`${value} (${props.payload.percentage}%)`, "Respondents"]}/>
              <Bar dataKey="count" name="Respondents" fill={COLORS[5]} radius={[0, 5, 5, 0]} >
                {data.aiTimeSavedLikertData.map((entry, index) => (
                  <Cell key={`cell-time-${index}`} fill={COLORS[(index+4) % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-slate-700/50 p-6 rounded-xl shadow-xl hover:shadow-purple-500/30 transition-shadow duration-300">
          <h3 className="text-xl font-semibold text-purple-300 mb-2">👥 Active AI Users</h3>
          <p className="text-4xl font-bold">{data.activeUsers}</p>
          <p className="text-sm text-slate-400 mt-1">Team members actively using AI tools (from survey).</p>
        </div>
        <div className="bg-slate-700/50 p-6 rounded-xl shadow-xl hover:shadow-pink-500/30 transition-shadow duration-300">
          <h3 className="text-xl font-semibold text-pink-300 mb-2">🏆 Top Tool</h3>
          <p className="text-4xl font-bold">{topTool}</p>
          <p className="text-sm text-slate-400 mt-1">Most used AI assistant (from survey).</p>
        </div>
        <div className="bg-slate-700/50 p-6 rounded-xl shadow-xl hover:shadow-red-500/30 transition-shadow duration-300">
          <h3 className="text-xl font-semibold text-red-300 mb-2">💬 Top Textual Concern</h3>
          <p className="text-4xl font-bold">{biggestTextualConcern}</p>
          <p className="text-sm text-slate-400 mt-1">Most cited challenge (from text comments).</p>
        </div>
         <div className="bg-slate-700/50 p-6 rounded-xl shadow-xl hover:shadow-green-500/30 transition-shadow duration-300">
          <h3 className="text-xl font-semibold text-green-300 mb-2">⏱️ Avg. Time Saved Daily</h3>
          <p className="text-4xl font-bold">{averageTimeSaved.toFixed(1)} hrs</p>
          <p className="text-sm text-slate-400 mt-1">Average hours saved per day by users.</p>
        </div>
      </div>

      {/* Row 1: Tool Popularity & Key Benefits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <div className="bg-slate-800/70 p-6 rounded-xl shadow-2xl">
          <h2 className="text-2xl font-semibold mb-6 text-center text-sky-300">🛠️ AI Tool Popularity (Survey)</h2>
          {toolDataForChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={toolDataForChart} margin={{ top: 5, right: 20, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                <XAxis dataKey="name" angle={-20} textAnchor="end" interval={0} tick={chartAxisTickProps} height={60} />
                <YAxis tick={chartAxisTickProps}/>
                <Tooltip {...chartTooltipProps} />
                <Legend {...chartLegendProps} />
                <Bar dataKey="users" name="Users" fill={COLORS[0]} radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-slate-400">No tool usage data to display.</p>}
        </div>

        <div className="bg-slate-800/70 p-6 rounded-xl shadow-2xl">
          <h2 className="text-2xl font-semibold mb-6 text-center text-emerald-300">🌟 Key Benefits Perceived (Text Comments)</h2>
          {benefitDataForChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  activeIndex={activeIndexPie}
                  activeShape={renderActiveShape}
                  data={benefitDataForChart}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={120}
                  fill={COLORS[1]}
                  dataKey="value"
                  onMouseEnter={onPieEnter}
                  nameKey="name"
                >
                  {benefitDataForChart.map((entry, index) => (
                    <Cell key={`cell-benefit-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                 <Tooltip {...chartTooltipProps}/>
                 <Legend {...chartLegendProps} layout="horizontal" verticalAlign="bottom" align="center" />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-slate-400">No benefits data from comments to display.</p>}
        </div>
      </div>
      
      {/* Row 2: AI Use Cases & Time Saved */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <div className="bg-slate-800/70 p-6 rounded-xl shadow-2xl">
          <h2 className="text-2xl font-semibold mb-6 text-center text-indigo-300">🎯 What AI is Used For (Survey)</h2>
          {data.aiUseCasesData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data.aiUseCasesData.sort((a,b) => b.count - a.count).slice(0,10)} layout="vertical" margin={{ top: 5, right: 30, left: 150, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
              <XAxis type="number" tick={chartAxisTickProps}/>
              <YAxis dataKey="useCase" type="category" width={140} tick={chartAxisTickProps} interval={0}/>
              <Tooltip {...chartTooltipProps} formatter={(value, name, props) => [`${value} (${props.payload.percentage}%)`, "Respondents"]}/>
              <Bar dataKey="count" name="Respondents" fill={COLORS[4]} radius={[0, 5, 5, 0]} />
            </BarChart>
          </ResponsiveContainer>
          ) : <p className="text-center text-slate-400">No AI use case data to display.</p>}
        </div>
         <div className="bg-slate-800/70 p-6 rounded-xl shadow-2xl">
          <h2 className="text-2xl font-semibold mb-6 text-center text-lime-300">⏳ Daily Time Saved with AI (Survey)</h2>
          {data.timeSavedData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data.timeSavedData.filter(d => d.count > 0)} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                <XAxis dataKey="hours" name="Hours Saved" tick={chartAxisTickProps}/>
                <YAxis tick={chartAxisTickProps}/>
                <Tooltip {...chartTooltipProps} formatter={(value, name, props) => [`${value} (${props.payload.percentage}%)`, "Respondents"]}/>
                <Bar dataKey="count" name="Respondents" fill={COLORS[5]} radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-slate-400">No time saved data to display.</p>}
        </div>
      </div>

      {/* Row 3: AI Reliability & Textual Concerns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <div className="bg-slate-800/70 p-6 rounded-xl shadow-2xl">
          <h2 className="text-2xl font-semibold mb-6 text-center text-cyan-300">👍 AI Tool Reliability (Survey)</h2>
          {data.aiReliabilityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.aiReliabilityData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                <XAxis dataKey="rating" tick={chartAxisTickProps}/>
                <YAxis tick={chartAxisTickProps}/>
                <Tooltip {...chartTooltipProps} formatter={(value, name, props) => [`${value} (${props.payload.percentage}%)`, "Respondents"]}/>
                <Bar dataKey="count" name="Respondents" fill={COLORS[6]} radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-slate-400">No reliability data to display.</p>}
        </div>
        <div className="bg-slate-800/70 p-6 rounded-xl shadow-2xl">
          <h2 className="text-2xl font-semibold mb-6 text-center text-amber-300">🤔 Main Concerns (Text Comments)</h2>
          {textualConcernDataForChart.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={textualConcernDataForChart} layout="vertical" margin={{ top: 5, right: 30, left: 150, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
              <XAxis type="number" tick={chartAxisTickProps}/>
              <YAxis dataKey="name" type="category" width={140} tick={chartAxisTickProps} interval={0}/>
              <Tooltip {...chartTooltipProps}/>
              <Bar dataKey="count" name="Mentions" fill={COLORS[2]} radius={[0, 5, 5, 0]} />
            </BarChart>
          </ResponsiveContainer>
          ) : <p className="text-center text-slate-400">No concerns data from comments to display.</p>}
        </div>
      </div>
      
      {/* Row 4: Word Cloud & Qualitative Concerns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <div className="bg-slate-800/70 p-6 rounded-xl shadow-2xl">
          <h2 className="text-2xl font-semibold mb-6 text-center text-rose-300">☁️ Concept Word Cloud (Text Comments)</h2>
          {data.sortedWordFrequency.length > 0 ? (
            <div className="max-h-[300px] overflow-y-auto p-2 rounded-md bg-slate-700/30">
              <div className="bg-white rounded-lg p-4 w-full h-full">
                <WordCloud
                  words={data.sortedWordFrequency.map(([text, value]) => ({ text, value }))}
                  options={{
                    fontSizes: [18, 48],
                    colors: COLORS,
                    enableTooltip: true,
                    deterministic: false,
                    fontFamily: 'inherit',
                    scale: 'sqrt',
                    transitionDuration: 500,
                  }}
                />
              </div>
            </div>
          ) : <p className="text-center text-slate-400">No keywords from comments for word cloud.</p>}
        </div>
        {data.qualitativeConcernsList.length > 0 && (
            <div className="bg-slate-800/70 p-6 rounded-xl shadow-2xl">
            <h2 className="text-2xl font-semibold mb-4 text-center text-orange-400">🗣️ Voice of the Team: Specific Concerns (Text)</h2>
            <ul className="list-disc list-inside space-y-2 text-slate-300 pl-4 max-h-[300px] overflow-y-auto">
                {data.qualitativeConcernsList.map((concern, index) => (
                <li key={index} className="text-sm sm:text-base">{concern}</li>
                ))}
            </ul>
            </div>
        )}
      </div>


      <footer className="text-center mt-12 py-6 border-t border-slate-700">
        <p className="text-slate-400">✨ Happy Hacking from your AI Insights Bot! Keep the great feedback coming! ({data.rawCommentCount} Text Comments Processed) ✨</p>
        <p className="text-xs text-slate-500 mt-2">Built by tech geeks with Gemini 2.5 Pro and Cursor editor 🤓✨</p>
      </footer>
    </div>
  );
};

export default App;
