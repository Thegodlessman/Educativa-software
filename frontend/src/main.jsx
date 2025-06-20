import 'bootstrap/dist/css/bootstrap.min.css';
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ClassProvider } from './context/ClassContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';


createRoot(document.getElementById('root')).render(
    <SocketProvider>
        <ClassProvider>
            <App />
        </ClassProvider>
    </SocketProvider>
)
