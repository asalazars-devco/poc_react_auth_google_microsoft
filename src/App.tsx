import React, { useState, useEffect } from "react";
import { googleLogout, useGoogleLogin } from "@react-oauth/google";
import { useMsal } from "@azure/msal-react";
import axios from "axios";
import Cookies from "js-cookie";

const loginRequest = {
    scopes: [],
};

function App() {
    const [user, setUser] = useState([]);
    const [profile, setProfile] = useState([]);
    const { instance, accounts } = useMsal();
    const activeAccount = instance.getActiveAccount();

    // Login GOOGLE
    const login = useGoogleLogin({
        onSuccess: async (codeResponse) => {
            console.log(codeResponse);
            setUser(codeResponse);

            const googleAccessToken = codeResponse.access_token;

            // Enviar el token de acceso de Google al backend para autenticación
            const response = await axios.post(
                "http://localhost:8000/authenticate_google",
                {
                    googleAccessToken: googleAccessToken,
                }
            );

            if (response.status === 200) {
                // Almacenar el token de acceso propio del backend
                console.log(response.data);

                if (response.data?.access_token) {
                    // Almacena el access_token en una cookie con un nombre específico
                    Cookies.set("access_token", response.data.access_token, {
                        expires: 0.5 / 24,
                    }); // La cookie expirará en media hora
                }
            } else {
                // Manejo de errores
            }
        },
        onError: (error) => console.log("Login Failed:", error),
    });

    useEffect(() => {
        if (user) {
            axios
                .get(
                    `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${user.access_token}`,
                    {
                        headers: {
                            Authorization: `Bearer ${user.access_token}`,
                            Accept: "application/json",
                        },
                    }
                )
                .then((res) => {
                    setProfile(res.data);
                })
                .catch((err) => console.log(err));
        }
    }, [user]);

    // log out function to log the user out of google and set the profile array to null
    const logOut = () => {
        googleLogout();
        instance.logoutPopup();
        setProfile(null);
    };

    const msLogin = () => {
        instance
            .loginPopup({
                ...loginRequest,
                prompt: "create",
            })
            .then(() => {
                const activeAccount = instance.getActiveAccount();
                console.log(activeAccount);

                // Enviar el token de acceso de Microsoft al backend para autenticación
                axios
                    .post("http://localhost:8000/authenticate_microsoft", {
                        microsoftIdToken: activeAccount.idToken,
                    })
                    .then((res) => {
                        console.log(res.data);

                        if (res.data?.access_token) {
                            // Almacena el access_token en una cookie con un nombre específico
                            Cookies.set("access_token", res.data.access_token, {
                                expires: 0.5 / 24,
                            }); // La cookie expirará en media hora
                        }
                    })
                    .catch((error) => console.log(error));
            })
            .catch((error) => console.log(error));

        console.log("CHECKPOINT");
        const accessTokenRequest = {
            scopes: [],
            // ...loginRequest,
            account: accounts[0],
        };
        instance
            .acquireTokenSilent(accessTokenRequest)
            .then((accessTokenResponse) => {
                // Acquire token silent success
                console.log(accessTokenResponse);
                let accessToken = accessTokenResponse.accessToken;

                axios.post("http://localhost:8000/authenticate_microsoft", {
                    microsoftAccessToken: accessToken,
                });

                axios
                    .get("https://graph.microsoft.com/oidc/userinfo", {
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    })
                    .then((res) => console.log(res.data))
                    .catch((err) => console.log(err));

                // Call your API with token
                console.log(accessToken);
                // const headers = new Headers();
                // const bearer = `Bearer ${accessToken}`;
                // headers.append("Authorization", bearer);

                // const options = {
                //     method: "GET",
                //     headers: headers,
                // };

                // fetch("https://graph.microsoft.com/v1.0/me", options)
                //     .then((response) => {
                //         response.json();
                //     })
                //     .then((data) => console.log("graph:", data));
            })
            .catch((error) => console.log(error));
    };

    const privateEndpoint = () => {
        axios
            .get("http://localhost:8000/private-info", {
                headers: {
                    Authorization: `Bearer ${Cookies.get("access_token")}`,
                },
            })
            .then((res) => console.log(res.data))
            .catch((err) => console.log(err));
    };

    return (
        <div>
            <h2>React Google Login</h2>
            <br />
            <br />
            {profile ? (
                <div>
                    <img src={profile.picture} alt="user image" />
                    <h3>User Logged in</h3>
                    <p>Name: {profile.name}</p>
                    <p>Email Address: {profile.email}</p>
                    <br />
                    <br />
                    <button onClick={logOut}>Log out</button>
                    <button onClick={privateEndpoint}>Endpoint Privado</button>
                </div>
            ) : (
                <>
                    <button onClick={() => login()}>
                        Sign in with Google 🚀{" "}
                    </button>
                    <button onClick={() => msLogin()}>
                        Sign in with Microsoft 🚀{" "}
                    </button>
                </>
            )}
            <p>Microsoft</p>
            <div>
                {activeAccount ? (
                    <div>
                        <p>Name: {activeAccount.name}</p>
                        <p>User Name: {activeAccount.username}</p>
                        <button onClick={logOut}>Log out</button>
                    </div>
                ) : (
                    <p>No user on Microsoft</p>
                )}
            </div>
        </div>
    );
}
export default App;
