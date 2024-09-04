defmodule LiveViewModel.Test.AuthorizedChannel do
  @moduledoc false

  use LiveViewModel.Channel, web_module: LiveViewModel.Test.Web

  def authorize(_channel, %{"password" => "secret"}, socket) do
    {:ok, socket}
  end

  def authorize(_channel, _payload, _socket) do
    {:error, "Go away!"}
  end

  def init(_channel, _payload, _socket) do
    {:ok, %{authorized: true}}
  end

  def handle_event(_event_name, _payload, state) do
    {:noreply, state}
  end
end
