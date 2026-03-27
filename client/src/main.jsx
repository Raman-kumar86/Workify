import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { Provider } from "react-redux";
import store from "./redux/store.jsx";
import { AuthProvider } from "./components/context/AuthContext.jsx";
import { SocketProvider } from "./context/SocketContext.jsx";
import { PopupProvider } from "./context/PopupContext.jsx";

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <BrowserRouter>
      <AuthProvider>
        <PopupProvider>
          <SocketProvider>
            <App />
          </SocketProvider>
        </PopupProvider>
      </AuthProvider>
    </BrowserRouter>
  </Provider>,
);

