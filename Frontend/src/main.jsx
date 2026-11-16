import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.jsx'
import { AuthProvider } from './context/authContext.jsx'
import { CartProvider } from './context/cartContext.jsx'
import { ThongBaoProvider } from './context/thongBaoContext.jsx'
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId= "875888602363-q6bq2f54h76c075516kj86r3v1fee32c.apps.googleusercontent.com">
      <BrowserRouter>
        <ThongBaoProvider>
          <AuthProvider>
            <CartProvider>
              <App />
            </CartProvider>
          </AuthProvider>
        </ThongBaoProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>,
)