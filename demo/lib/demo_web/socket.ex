defmodule DemoWeb.Socket do
  @moduledoc false
  use Phoenix.Socket

  channel("room:*", DemoWeb.ChatChannel)

  @impl true
  def connect(%{"token" => "socket_token"}, socket) do
    {:ok, socket}
  end

  @impl true
  def connect(_params, _socket) do
    {:error, "unauthorized"}
  end

  @impl true
  def id(_socket) do
    nil
  end
end
