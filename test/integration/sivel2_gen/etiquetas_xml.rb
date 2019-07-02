# frozen_string_literal:true

require 'test_helper'
require 'nokogiri'
require 'open-uri'

module Sivel2Gen
  class EtiquetasXml < ActionDispatch::IntegrationTest

    include Devise::Test::IntegrationHelpers
    include Engine.routes.url_helpers

    setup do
      @current_usuario = ::Usuario.create(PRUEBA_USUARIO)
      sign_in @current_usuario
      @routes = Engine.routes
    end

    PRUEBA_CASO_BASICOS = {
      fecha: '2014-11-19'.freeze,
      memo: ''.freeze,
      created_at: '2014-11-11'.freeze,
      titulo: 'Caso de prueba con datos basicos'.freeze,
      hora: '6 pm'.freeze,
      duracion: '1 hora'.freeze
    }
 
     PRUEBA_ETIQUETA = {
       nombre: 'n'.freeze,
       fechacreacion: '2014-08-05'.freeze,
       fechadeshabilitacion: nil
     }

    PRUEBA_PRESPONSABLE ={
        id: 1000,
        nombre: 'presunto'.freeze,
        papa: 1000,
        fechacreacion: '2014-09-09'.freeze,
        created_at: '2014-09-09'.freeze
    }

    PRUEBA_TVIOLENCIA = {
      id: 'S'.freeze,
      nombre: 'VIOLENCIA POLÍTICO SOCIAL'.freeze,
      nomcorto: 'nombrec'.freeze,
      fechacreacion: '2014-09-09'.freeze,
      created_at: '2014-09-09'.freeze
    }
 
    PRUEBA_PERSONA = {
      nombres: 'Nombres'.freeze,
      apellidos: 'Apellidos'.freeze,
      anionac: 1974,
      mesnac: 1,
      dianac: 1,
      sexo: 'F'.freeze,
      id_pais: 170,
      id_departamento: 15,
      id_municipio: 610,
      tdocumento_id: 1,
      numerodocumento: '10000000'.freeze,
      nacionalde: 170
    }

    test 'Valida caso con una etiqueta' do
      caso = Sivel2Gen::Caso.create! PRUEBA_CASO_BASICOS
      etiqueta = Sip::Etiqueta.create(
        id: 1000,
        nombre: 'Etiqueta'.freeze,
        fechacreacion: '2014-09-09'.freeze,
        created_at: '2014-09-09'.freeze
      )
      casoetiqueta = Sivel2Gen::CasoEtiqueta.create(
        id: 1000,
        id_caso: caso.id,
        id_etiqueta: etiqueta.id,
        id_usuario: @current_usuario.id,
        fecha: '2014-09-09'.freeze,
        created_at: '2014-09-09'.freeze
      )
      get caso_path(caso)+'.xml'
      puts @response.body
      file = guarda_xml(@response.body)
      docu = File.read(file)
      verifica_dtd(docu)
      caso.destroy
      etiqueta.destroy
      casoetiqueta.destroy
    end
 
   def guarda_xml(docu)
     file = File.new('test/dummy/public/relatos.xrlat', 'wb')
     file.write(docu)
     file.close
     file
   end

   def verifica_dtd(docu)
     options = Nokogiri::XML::ParseOptions::DTDVALID
     doc = Nokogiri::XML::Document.parse(docu, nil, nil, options)
     puts doc.external_subset.validate(doc)
     assert_empty doc.external_subset.validate(doc)
   end
 end
end
