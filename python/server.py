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
			self.host.send({"type": "player_joined_game", "connection_id": connection.id, "players": players})

	def remove_connection(self, connection):

		try:
			self.lobby.remove(connection)
		except ValueError:
			pass

		# Migrate host
		if connection is self.host and len(self.lobby) > 0:
			self.host = self.lobby[0]
			self.host.send({"type": "upgrade"})

		self.host.send({"type": "player_left_game", "connection_id": connection.id})

	def update_game_state(self, connection, state):

		if connection is self.host:
			for conn in self.lobby:
				if conn is not self.host:
					conn.send({"type": "update_game_state", "state": state})

	def update_player_input(self, connection, input):

		if connection is not self.host:
			self.host.send({"type": "update_player_input", "connection_id": connection.id, "input": input})


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

		conn.send({"type": "connect", "connection_id": conn.id})

		while(conn.alive and self.alive):
			
			msg = conn.receive(5)

			type = msg.get("type")

			if type == "create_game":
				self.create_game(conn)

			elif type == "get_games":

				games = []
				with self.games_lock:
					for game in self.games:
						games.append({"id": game.id, "players": len(game.lobby)})

				conn.send({"type": "get_games", "games": games})

			elif type == "join_game":
				self.join_game(conn, msg.get("game_id"), msg.get("players"))

			elif type == "leave_game":
				self.leave_game(conn)

			elif type == "update_game_state":
				self.update_game_state(conn, msg.get("state"))

			elif type == "update_player_input":
				self.update_player_input(conn, msg.get("input"))

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

				# Remove game once all players have left
				if len(joined.lobby) == 0:
					self.games.remove(joined)

			connection.send({"type": "leave_game", "status": "ok"})

		else:
			connection.send({"type": "leave_game", "status": "fail"})

	def update_game_state(self, connection, state):

		joined = self.get_connection_game(connection)

		if joined is not None:
			with self.games_lock:
				joined.update_game_state(connection, state)

		else:
			connection.send({"type": "update_game_state", "status": "fail"})

	def update_player_input(self, connection, input):

		joined = self.get_connection_game(connection)

		if joined is not None:
			with self.games_lock:
				joined.update_player_input(connection, input)

		else:
			connection.send({"type": "update_player_input", "status": "fail"})

# Run Server
server = host("0.0.0.0", 5002)

thread = Thread(target=server.run)
thread.start()

input("Press Enter to shutdown server...")
server.stop()
thread.join()