# encoding: UTF-8
require 'rails_helper'

RSpec.describe Presponsable, :type => :model do

  it "valido" do
		presponsable = FactoryGirl.build(:presponsable)
		expect(presponsable).to be_valid
		presponsable.destroy
	end

  it "no valido" do
		presponsable = FactoryGirl.build(:presponsable, nombre: '')
		expect(presponsable).not_to be_valid
		presponsable.destroy
	end

	it "existente" do
		presponsable = Presponsable.where(id: 35).take
		expect(presponsable.nombre).to eq("SIN INFORMACIÓN")
	end

end

