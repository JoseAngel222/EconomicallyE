import { useContext, useEffect, useState } from 'react';

const  Register = () => {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [error, setError] = useState('');


    const handleLogin = async (e) => {

        e.preventDefault();

        //Validacion
        if (email == null || password == null || confirmPassword == null){
            setError("Todos los campos son obligatorios");
            return;
        }

        if (password != confirmPassword){
            setError("Las contraseñas no coinciden");
            return
        }


        try {
            const  response = await fetch('http://localhost:8080/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (response.ok) {
                const data = await response.json();
                console.log("Registro exitoso: ", data)

            }else {
                setError("Error al registrar. Intentalo de nuevo");
            }

        }catch (err){
            setError("Error en la conexion.");
        }
    };
    return (
        <div className="register-form">
            <h2>Registro</h2>
            <form onSubmit={handleRegister}>
                <div>
                    <label>Email o usuario</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Contraseña</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Confirmar Contraseña</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>
                {error && <p className="error">{error}</p>}
                <button type="submit">Entra</button>
            </form>
        </div>
    );
};

export default Register;