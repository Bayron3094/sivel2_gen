# encoding: UTF-8
module Sivel2Gen
  module Admin
    class ActividadareasController < BasicasController
      before_action :set_actividadarea, only: [:show, :edit, :update, :destroy]
      load_and_authorize_resource
  
      def clase 
        "Sivel2Gen::Actividadarea"
      end
  
      def set_actividadarea
        @basica = Actividadarea.find(params[:id])
      end
  
      def atributos_index
        ["id", "nombre", "observaciones", "fechacreacion", 
          "fechadeshabilitacion"]
      end
 
      def index
        puts "Actividadareascontroller index"
      end

      def actividadarea_params
        params.require(:actividadarea).permit(*atributos_form)
      end
    end
  end
end