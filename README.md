## Superfighters JS
This is a reimplementation of the flash game [Superfighters](https://mythologicinteractive.com/Superfighters) in JavaScript. Based on a decompilation of ActionScript I reimplementated game mechanics so that they could be used in a multiplayer environment. Ultimately this was just to test viability of rollback netcode in the browser.

## About
This project makes use of Python to handle the matchmaking and relay server, PHP to serve the site, and JavaScript to handle the game code.

## Usage
1. Clone repository
2. Serve the directory using an HTTP server (Apache, Nginx)
```bash
ln -s <cloned repository> <www dir>
```
3. Execute the `server.py`
```bash
python3 ./python/server.py
```