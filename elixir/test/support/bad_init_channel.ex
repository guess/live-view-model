defmodule LiveViewModel.Test.BadInitChannel do
  @moduledoc false

  use LiveViewModel.Channel, web_module: LiveViewModel.Test.Web

  def init(_channel, _params, _socket) do
    {:error, "you stink"}
  end
end
