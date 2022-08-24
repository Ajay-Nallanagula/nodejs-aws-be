export const isTokenValid = (authorizationToken) => {
  const authToken = authorizationToken.split(" ");
  const buffer = Buffer.from(authToken[1], "base64");
  const credentials = buffer.toString();
  const [username, pwd] = credentials.split(":");
  console.log({ isTokenValid: process.env[username] === pwd });
  return process.env[username] === pwd;
};
