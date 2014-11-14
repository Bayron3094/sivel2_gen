# encoding: UTF-8
module Sivel2Gen
  module Admin
    class BasicasController < ApplicationController
      include BasicasHelpers
      helper BasicasHelpers
      load_and_authorize_resource

      # Despliega listado de registros
      def index
        puts "basicas index"
        c = clase.constantize
        puts "c=" + c.to_s
        @basica = c.order(camponombre).paginate(
          :page => params[:pagina], per_page: 20
        )
      end

      # Despliega detalle de un registro
      def show
      end

      # Presenta formulario para crear nuevo registro
      def new
        c = clase.constantize
        @basica = clase.constantize.new
        @basica.fechacreacion = DateTime.now.strftime('%Y-%m-%d')
      end

      # Despliega formulario para editar un regisro
      def edit
        @basica = clase.constantize.find(params[:id])
      end

      # Crea un registro a partir de información de formulario
      def create
        c2 = clase.underscorize().gsub(/\//, '_')
        @basica = clase.constantize.new(send(c2 + '_params'))
        respond_to do |format|
          if @basica.save
            format.html { 
              redirect_to admin_basica_path(@basica), 
              notice: clase + ' creada.' 
            }
            format.json { 
              render action: 'show', 
              status: :created, 
              location: @basica
            }
          else
            format.html { render action: 'new' }
            format.json { 
              render json: @basica.errors, 
              status: :unprocessable_entity 
            }
          end
        end
      end

      # Actualiza un registro con información recibida de formulario
      def update
        respond_to do |format|
          c2 = clase.underscorize().gsub(/\//, '_')
          if @basica.update(send(c2 + "_params"))
            format.html { 
              redirect_to admin_basica_path(@basica), 
              notice: clase + ' actualizada.' 
            }
            format.json { head :no_content }
          else
            format.html { render action: 'edit' }
            format.json { 
              render json: @basica.errors, status: :unprocessable_entity 
            }
          end
        end
      end

      # Elimina un registro 
      def destroy
        @basica.destroy
        respond_to do |format|
          format.html { redirect_to admin_basicas_url(@basica) }
          format.json { head :no_content }
        end
      end

      # Nombre de la tabla básica
      def clase 
        "BASICA_CAMBIAR"
      end

      # Genero del nombre (F - Femenino, M - Masculino)
      def genclase
        return 'F';
      end

      # Nombre del campo con nombre que identifica cada registro
      def camponombre
        return :nombre
      end

      # Campos de la tabla
      def atributos_index
        ["id", "nombre", "fechacreacion", "fechadeshabilitacion"]
      end

      # Campos que se esperan del formulario
      def atributos_form
        atributos_index - ["id"]
      end

      helper_method :clase, :atributos_index, :atributos_form, :genclase, :camponombre
    end
  end
end