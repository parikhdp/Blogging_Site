import { useContext, useState } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "../UserContext";
import Modal from 'react-modal'; // Import react-modal

Modal.setAppElement('#root'); // Set the app element for accessibility

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [redirect, setRedirect] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false); // State to control modal visibility
  const [modalMessage, setModalMessage] = useState('');  // State to control modal content (success/failure message)
  const { setUserInfo } = useContext(UserContext);

  async function login(ev) {
    ev.preventDefault();
    const response = await fetch('http://localhost:4000/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (response.ok) {
      response.json().then(userInfo => {
        setUserInfo(userInfo);
        setModalMessage(`Welcome back, ${username}!`);  // Success message
        setModalIsOpen(true); // Open modal on successful login
      });
    } else {
      setModalMessage('Login failed. Please check your credentials and try again.');  // Failure message
      setModalIsOpen(true); // Open modal on failed login
    }
  }

  function closeModal() {
    setModalIsOpen(false);
    if (modalMessage.includes('Welcome back')) {
      setRedirect(true); // Redirect only for successful login when modal is closed
    }
  }

  if (redirect) {
    return <Navigate to={'/'} />
  }

  return (
    <>
      <form className="login" onSubmit={login}>
        <h1>Login</h1>
        <input type="text"
               placeholder="username"
               value={username}
               onChange={ev => setUsername(ev.target.value)} />
        <input type="password"
               placeholder="password"
               value={password}
               onChange={ev => setPassword(ev.target.value)} />
        <button>Login</button>
      </form>

      {/* Modal for both successful and failed login */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Login Result"
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            padding: '20px',
            textAlign: 'center'
          }
        }}
      >
        <h2>{modalMessage.includes('Welcome back') ? 'Login Successful' : 'Login Failed'}</h2>
        <p>{modalMessage}</p>
        <button onClick={closeModal}>Close</button>
      </Modal>
    </>
  );
}
