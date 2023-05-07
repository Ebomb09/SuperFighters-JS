import json
from threading import Thread, Lock
from websockets.exceptions import ConnectionClosed

from websockets.sync.server import serve


class connection:
	id_iterator = 0

	def __init__(self, ws):
		"""
		Create a self referential id and copy the websocket
		"""

		self.id = self.get_next_id()
		self.ws = ws
		self.alive = True

	def get_next_id(self):
		connection.id_iterator += 1
		return connection.id_iterator

	def receive(self, timeout=None):
		"""
		Try to receive message from the websocket.
		Return the message contents, on failure,
		kills the connection.
		"""

		try:
			data = self.ws.recv(timeout)
			return json.loads(data)

		except ConnectionClosed:
			self.alive = False
			return {"type": "connection_closed"}

		except TimeoutError:
			return {"type": "timeout_error"}

		except json.JSONDecodeError:
			return {"type": "json_decode_error"}


	def send(self, data):
		"""
		Try to send a message to the websocket.
		Returns the success of the message send,
		on failure kills the connection.
		"""

		try:
			msg = json.dumps(data, default=vars)
			self.ws.send(msg)
			return True

		except ConnectionClosed:
			self.alive = False
			return False

class game:
	id_iterator = 0

	def __init__(self, connection):

		self.id = self.get_next_id()
		self.host = connection
		self.lobby = [connection]

		self.state = {
			"map": "",
			"input": {}
		}
		self.message_log = []

	def get_next_id(self):
		game.id_iterator += 1
		return game.id_iterator

	def add_connection(self, connection, players):
		found = False

		for conn in self.lobby:
			if conn.id == connection.id:
				found = True

		if not found:
			self.lobby.append(connection)
			self.host.send({"type": "player_joined_game", "status": "ok", "player_id": connection.id, "players": players})

	def remove_connection(self, connection):

		try:
			self.lobby.remove(connection)
		except ValueError:
			pass

		self.host.send({"type": "player_left_game", "status": "ok", "player_id": connection.id})

	def update_state(self, connection, state):

		if connection == self.host:
			self.state["map"] = state["map"]

		self.state["input"][str(connection.id)] = state["input"]

	def get_state(self):
		return self.state


class host:

	def __init__(self, ip, port):
		self.connections = []
		self.connections_lock = Lock()

		self.games = []
		self.games_lock = Lock()

		self.alive = False
		self.server = serve(self.handler, ip, port)

	def run(self):
		self.alive = True
		self.server.serve_forever()

	def stop(self):
		self.alive = False
		self.server.shutdown()

	def handler(self, ws):

		# Add to connections list, if failed then abort websocket
		conn = self.add_connection(ws)

		if conn is None:
			return

		while(conn.alive and self.alive):
			
			msg = conn.receive(5)

			if msg["type"] == "create_game":
				self.create_game(conn)

			elif msg["type"] == "get_games":

				games = []
				with self.games_lock:
					for game in self.games:
						games.append({"id": game.id, "players": len(game.lobby)})

				conn.send({"type": "get_games", "status": "ok", "games": games})

			elif msg["type"] == "join_game":
				self.join_game(conn, msg["game_id"], msg["players"])

			elif msg["type"] == "leave_game":
				self.leave_game(conn)

			elif msg["type"] == "update_game_state":
				self.update_game_state(conn, msg["state"])

			elif msg["type"] == "get_game_state":
				self.update_game_state(conn, "")

		# Signal to leave if in a game
		self.leave_game(conn)

		# Remove the old connection		
		with self.connections_lock:
			self.connections.remove(conn)

		return

	def add_connection(self, ws):
		conn = None

		with self.connections_lock:
			conn = connection(ws)

			if conn is not None:
				self.connections.append(conn)

		return conn

	def get_connection_game(self, connection):
		current_game = None

		with self.games_lock:

			for game in self.games:
				for conn in game.lobby:
					if conn.id == connection.id:
						current_game = game

		return current_game

	def create_game(self, connection):

		joined = self.get_connection_game(connection)

		if joined is None:
			with self.games_lock:
				self.games.append(game(connection))
			connection.send({"type": "create_game", "status": "ok"})

		else:
			connection.send({"type": "create_game", "status": "fail"})
			
	def join_game(self, connection, game_id, players):

		joined = self.get_connection_game(connection)

		if joined is None:
			found = False

			with self.games_lock:
				for game in self.games:
					if game.id == game_id:
						game.add_connection(connection, players)
						found = True

			if found:
				connection.send({"type": "join_game", "status": "ok"})
			else:
				connection.send({"type": "join_game", "status": "fail"})

		else:
			connection.send({"type": "join_game", "status": "fail"})

	def leave_game(self, connection):

		joined = self.get_connection_game(connection)

		if joined is not None:

			with self.games_lock:
				joined.remove_connection(connection)
			connection.send({"type": "leave_game", "status": "ok"})

		else:
			connection.send({"type": "leave_game", "status": "fail"})

	def update_game_state(self, connection, state):

		joined = self.get_connection_game(connection)

		if joined is not None:
			with self.games_lock:
				joined.update_state(connection, state)
				connection.send({"type": "update_game_state", "status": "ok", "state": joined.get_state()})

		else:
			connection.send({"type": "update_game_state", "status": "fail"})

# Run Server
server = host("0.0.0.0", 5002)

thread = Thread(target=server.run)
thread.start()

input("Press Enter to shutdown server...")
server.stop()
thread.join()