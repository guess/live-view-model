defmodule DemoWeb.ChatChannel do
  @moduledoc false
  use LiveViewModel.Channel, web_module: DemoWeb

  # @impl true
  #  def authorize(_channel, %{"token" => "channel_token"}, _socket)  do
  #    {:error, "unauthorized""}
  #  end

  # @impl true
  #  def authorize(_channel, _payload, _socket)  do
  #    {:error, "unauthorized""}
  #  end

  @impl true
  def init(_channel, _payload, _socket) do
    {:ok, %{username: "Steve", messages: []}}
  end

  @impl true
  def handle_event("send_message", %{"message" => message}, state) do
    IO.puts("Sending message: #{message}")
    name = state.username
    messages = [%{from: name, message: message} | state.messages]
    state = %{state | messages: messages}
    {:noreply, state}
  end
end
