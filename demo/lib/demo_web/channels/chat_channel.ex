defmodule DemoWeb.ChatChannel do
  @moduledoc false
  use LiveViewModel.Channel, web_module: DemoWeb

  alias LiveViewModel.Event

  # @impl true
  #  def authorize(_channel, %{"token" => "channel_token"}, _socket)  do
  #    {:error, "unauthorized""}
  #  end

  # @impl true
  #  def authorize(_channel, _payload, _socket)  do
  #    {:error, "unauthorized""}
  #  end

  @impl true
  def init(topic, params, _socket) do
    dbg(topic)
    dbg(params)
    {:ok, %{username: "Steve", messages: []}}
  end

  @impl true
  def handle_event("send_message", %{"message" => "reply"}, state) do
    IO.puts("Sending message: reply")
    {:reply, %Event{name: "navigate", detail: %{to: "example.com"}}, state}
  end

  @impl true
  def handle_event("send_message", %{"message" => "reply2"}, state) do
    IO.puts("Sending message: reply2")
    {:reply, %Event{name: "message", detail: %{to: "steve", from: "mike"}}, state}
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
