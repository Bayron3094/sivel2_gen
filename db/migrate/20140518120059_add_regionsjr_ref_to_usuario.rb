class AddRegionsjrRefToUsuario < ActiveRecord::Migration[4.2]
  def change
    add_reference :usuario, :regionsjr, index: true
  end
end
