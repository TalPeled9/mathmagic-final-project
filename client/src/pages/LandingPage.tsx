import { useNavigate } from 'react-router';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div>
      <h1>Landing Page</h1>
      <button type="button" onClick={() => navigate('/register')}>
        Go to Register
      </button>
    </div>
  );
}
