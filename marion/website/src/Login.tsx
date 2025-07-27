
import { useState } from 'react';

export default function Login() {
	const [showLogin, setShowLogin] = useState(false);

	const toggleLogin = () => {
		setShowLogin(!showLogin);
	};

	return (
		<div className="login">
			<button onClick={toggleLogin}>
				{showLogin ? 'closed' : 'Login'}
			</button>
			{showLogin && (
				<div>
					<h2>Login</h2>
					<form>
						<input type="text" placeholder="Username" />
						<input type="password" placeholder="Password" />
						<button type="submit">Se connecter</button>
					</form>
				</div>
			)}
		</div>
	);
}