defmodule LiveViewModel.Test.Thing do
  @moduledoc false
  defstruct [:foo, :bar]
end

defimpl LiveViewModel.Encoder, for: LiveViewModel.Test.Thing do
  @moduledoc false
  def encode(%LiveViewModel.Test.Thing{foo: foo}, []) do
    %{foo: foo}
  end
end

defmodule LiveViewModel.Test.OtherThing do
  @moduledoc false
  @derive [{LiveViewModel.Encoder, except: [:wuzzle, :__meta__]}]

  defstruct [:bing, :baz, :wuzzle, :__meta__]
end

defmodule LiveViewModel.Test.OnlyThing do
  @moduledoc false
  @derive [{LiveViewModel.Encoder, only: [:baz, :wuzzle]}]

  defstruct [:bing, :baz, :wuzzle]
end

defmodule LiveViewModel.Test.FakeSchema do
  @moduledoc false
  use Ecto.Schema

  schema "fake_table" do
    field(:foo, :string)
    field(:name, :string)
    field(:birth_date, :utc_datetime)
    timestamps()
  end
end
