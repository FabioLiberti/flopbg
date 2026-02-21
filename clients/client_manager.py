import random
import logging
from typing import Any, Dict, List, Optional

class ClientManager:
    """
    Manages client registration, selection, and dynamic tiering with reputation-based incentives.
    """

    def __init__(self, client_types: Dict[str, Dict[str, float]], clients: Optional[List[Any]] = None):
        """
        Initializes the ClientManager.

        Parameters:
            client_types (Dict[str, Dict[str, float]]): Configuration for different client types.
            clients (List, optional): List of client instances. Defaults to None.
        """
        self.clients: Dict[int, Any] = {}  # Dictionary of clients {client_id: client_object}
        self.reputation_scores: Dict[int, float] = {}  # Reputation system
        self.client_types = client_types
        self.tiers: Dict[str, List[Any]] = {client_type: [] for client_type in client_types}

        if clients:
            for client in clients:
                self.register_client(client)

    def register_client(self, client: Any):
        """
        Registers a new client and initializes their reputation.

        Parameters:
            client (Client): The client instance to register.
        """
        self.clients[client.client_id] = client
        self.reputation_scores[client.client_id] = 1.0  # Initial reputation
        self.assign_tier(client)
        logging.info(f"Registered client {client.client_id} in tier '{client.client_type}'.")

    def assign_tier(self, client):
        """
        Assigns the client to the tier corresponding to their type.

        Parameters:
            client (Client): The client instance to assign to a tier.
        """
        if client.client_type in self.tiers:
            self.tiers[client.client_type].append(client)
            logging.debug(f"Client {client.client_id} assigned to tier '{client.client_type}'.")
        else:
            self.tiers[client.client_type] = [client]
            logging.debug(f"Client {client.client_id} assigned to new tier '{client.client_type}'.")

    def update_reputation(self, client_id, contribution):
        """
        Updates the client's reputation based on their contribution.

        Parameters:
            client_id (int): The ID of the client.
            contribution (float): The amount to adjust the reputation by.
        """
        if client_id in self.reputation_scores:
            self.reputation_scores[client_id] += contribution
            logging.debug(f"Client {client_id} reputation updated by {contribution}. New reputation: {self.reputation_scores[client_id]}")
        else:
            self.reputation_scores[client_id] = contribution
            logging.debug(f"Client {client_id} reputation initialized to {contribution}.")

    def select_active_clients(self, global_participation_rate: float) -> List:
        """
        Selects active clients for the current training round based on individual participation rates.

        Parameters:
            global_participation_rate (float): The overall participation rate.

        Returns:
            List: List of selected client instances.
        """
        active_clients = []
        for client in self.clients.values():
            effective_rate = global_participation_rate * getattr(client, 'participation_rate', 1.0)
            if random.random() <= effective_rate:
                active_clients.append(client)
        logging.info(f"Selected {len(active_clients)} active clients out of {len(self.clients)}")
        return active_clients

    def get_all_clients(self) -> List[Any]:
        """
        Returns the list of all registered clients.

        Returns:
            List: List of all client instances.
        """
        return list(self.clients.values())

    def get_incentivized_clients(self, num_clients: int) -> List:
        """
        Selects clients based on their reputation using weighted selection.

        Parameters:
            num_clients (int): Number of clients to select.

        Returns:
            List: List of selected client instances.
        """
        total_reputation = sum(self.reputation_scores.values())
        clients_list = list(self.clients.values())

        if total_reputation == 0:
            # If total reputation is zero, select randomly
            probabilities = None
        else:
            probabilities = [
                self.reputation_scores[client.client_id] / total_reputation
                for client in clients_list
            ]

        num_clients = min(num_clients, len(clients_list))

        selected_clients = random.choices(
            clients_list, weights=probabilities, k=num_clients
        )
        return selected_clients

    def get_training_times(self) -> Dict[int, float]:
        """
        Retrieves the training times of all clients.

        Returns:
            Dict[int, float]: Dictionary mapping client IDs to their training times.
        """
        training_times = {}
        for client in self.clients.values():
            training_times[client.client_id] = getattr(client, 'last_training_time', 0)
        return training_times

    def reset_clients(self):
        """
        Resets all registered clients to their initial state.
        """
        for client in self.clients.values():
            client.reset()
        logging.info("All clients have been reset.")
        