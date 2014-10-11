# encoding: UTF-8
class CasosController < ApplicationController
  before_action :set_caso, only: [:show, :edit, :update, :destroy]
  load_and_authorize_resource

  # GET /casos
  # GET /casos.json
  def index
    if !ActiveRecord::Base.connection.table_exists? 'conscaso'
      ActiveRecord::Base.connection.execute("CREATE OR REPLACE VIEW conscaso1 AS
        SELECT caso.id as caso_id, caso.fecha, caso.memo, 
        ARRAY_TO_STRING(ARRAY(SELECT departamento.nombre ||  ' / ' || municipio.nombre 
        FROM ubicacion LEFT JOIN departamento ON (
        ubicacion.id_pais = departamento.id_pais
        AND ubicacion.id_departamento = departamento.id)
        LEFT JOIN municipio ON (ubicacion.id_pais=municipio.id_pais
        AND ubicacion.id_departamento=municipio.id_departamento
        AND ubicacion.id_municipio=municipio.id) WHERE ubicacion.id_caso=caso.id), ', ')
        AS ubicaciones, 
        ARRAY_TO_STRING(ARRAY(SELECT nombres || ' ' || apellidos FROM persona, 
        victima WHERE persona.id=victima.id_persona AND victima.id_caso=caso.id), ', ')
        AS victimas, 
        ARRAY_TO_STRING(ARRAY(SELECT nombre FROM presponsable, caso_presponsable
        WHERE presponsable.id=caso_presponsable.id_presponsable
        AND caso_presponsable.id_caso=caso.id), ', ')
        AS presponsables, 
        ARRAY_TO_STRING(ARRAY(SELECT categoria.id_tviolencia || ':' || 
        categoria.id_supracategoria || ':' || categoria.id || ' ' ||
        categoria.nombre FROM categoria, acto
        WHERE categoria.id=acto.id_categoria
        AND acto.id_caso=caso.id), ', ')
        AS tipificacion
        FROM caso;")
      ActiveRecord::Base.connection.execute("CREATE MATERIALIZED VIEW conscaso AS
        SELECT caso_id, fecha, memo, ubicaciones, victimas, presponsables, tipificacion, 
        to_tsvector('spanish', unaccent(caso_id || ' ' || replace(cast(fecha AS varchar), '-', ' ') 
         || ' ' || memo || ' ' || ubicaciones || ' ' || victimas || ' ' || presponsables || ' ' || tipificacion)) as q
        FROM conscaso1");
      ActiveRecord::Base.connection.execute("CREATE INDEX busca_conscaso ON conscaso USING gin(q);")
    else
      ActiveRecord::Base.connection.execute('REFRESH MATERIALIZED VIEW conscaso')
    end
    q=params[:q]
    if (q && q.strip.length>0)
        @conscaso = Conscaso.where("q @@ plainto_tsquery('spanish', ?)", q)
    else
        @conscaso = Conscaso.all
    end
    @conscaso = @conscaso.order(fecha: :desc).paginate(:page => params[:pagina], per_page: 20)
  end

  # GET /casos/1
  # GET /casos/1.json
  def show
  end

  # GET /casos/new
  def new
    @caso.current_usuario = current_usuario
    @caso.fecha = DateTime.now.strftime('%Y-%m-%d')
    @caso.memo = ''
    @caso.save!
    cu = CasoUsuario.new
    cu.id_usuario = current_usuario.id
    cu.id_caso = @caso.id
    cu.fechainicio = DateTime.now.strftime('%Y-%m-%d')
    cu.save!
    render action: 'edit'
  end


	def lista
    if !params[:tabla].nil?
			r = nil
			if (params[:tabla] == "departamento" && params[:id_pais].to_i > 0)
				r = Departamento.where(fechadeshabilitacion: nil,
                               id_pais: params[:id_pais].to_i).order(:nombre)
			elsif (params[:tabla] == "municipio" && params[:id_pais].to_i > 0 && 
             params[:id_departamento].to_i > 0 )
				r = Municipio.where(id_pais: params[:id_pais].to_i, 
                            id_departamento: params[:id_departamento].to_i,
                            fechadeshabilitacion: nil).order(:nombre)
			elsif (params[:tabla] == "clase" && params[:id_pais].to_i > 0 && 
             params[:id_departamento].to_i > 0 && 
             params[:id_municipio].to_i > 0)
        r = Clase.where(id_pais: params[:id_pais].to_i, 
                        id_departamento: params[:id_departamento].to_i, 
                        id_municipio: params[:id_municipio].to_i,
                        fechadeshabilitacion: nil).order(:nombre)
			end
			respond_to do |format|
				format.js { render json: r }
				format.html { render json: r }
			end
      return
    end
    respond_to do |format|
      format.html { render inline: 'No' }
    end
  end

  # GET /casos/1/edit
  def edit
  end

  # POST /casos
  # POST /casos.json
  def create
    @caso.current_usuario = current_usuario
    @caso.memo = ''
    @caso.titulo = ''

    respond_to do |format|
      if @caso.save
        format.html { redirect_to @caso, notice: 'Caso creado.' }
        format.json { render action: 'show', status: :created, location: @caso }
      else
        format.html { render action: 'new' }
        format.json { render json: @caso.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /casos/1
  # PATCH/PUT /casos/1.json
  def update
    respond_to do |format|
      if (!params[:caso][:caso_etiqueta_attributes].nil?)
        params[:caso][:caso_etiqueta_attributes].each  do |k,v|
          if (v[:id_usuario].nil? || v[:id_usuario] == "") 
            v[:id_usuario] = current_usuario.id
          end
        end
      end
      if @caso.update(caso_params)
        format.html { redirect_to @caso, notice: 'Caso actualizado.' }
        format.json { head :no_content }
        format.js   { redirect_to @caso, notice: 'Caso actualizado.' }
      else
        format.html { render action: 'edit' }
        format.json { render json: @caso.errors, status: :unprocessable_entity }
        format.js   { render action: 'edit' }
      end
    end
  end

  # DELETE /casos/1
  # DELETE /casos/1.json
  def destroy
    @caso.destroy
    respond_to do |format|
      format.html { redirect_to casos_url }
      format.json { head :no_content }
    end
  end
  private
    # Use callbacks to share common setup or constraints between actions.
    def set_caso
      @caso = Caso.find(params[:id])
      @caso.current_usuario = current_usuario
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def caso_params
      params.require(:caso).permit(
        :q,
        :id, :titulo, :fecha, :hora, :duracion,  
        :grconfiabilidad, :gresclarecimiento, :grimpunidad, :grinformacion, 
        :bienes, :id_intervalo, :memo, 
        :victima_attributes => [
          :id, :id_persona, :id_profesion, :id_rangoedad, :id_etnia, 
          :id_filiacion, :id_organizacion, :id_vinculoestado, :anotaciones,
          :id_iglesia, :orientacionsexual, :_destroy, 
          :persona_attributes => [
            :id, :nombres, :apellidos, :anionac, :mesnac, :dianac, 
            :id_pais, :id_departamento, :id_municipio, :id_clase, 
            :nacionalde, :numerodocumento, :sexo, :tdocumento_id
          ],
        ], 
        :ubicacion_attributes => [
          :id, :id_pais, :id_departamento, :id_municipio, :id_clase, 
          :lugar, :sitio, :latitud, :longitud, :id_tsitio, 
          :_destroy
        ],
        :caso_presponsable_attributes => [
          :id, :id_presponsable, :tipo, 
          :bloque, :frente, :brigada, :batallon, :division, :otro, :_destroy
        ],
        :acto_attributes => [
          :id, :id_presponsable, :id_categoria, 
          :id_persona, :_destroy
        ],
        :anexo_attributes => [
					:id, :fecha, :descripcion, :archivo, :adjunto, :_destroy
				],
        :caso_etiqueta_attributes => [
          :id, :id_usuario, :fecha, :id_etiqueta, :observaciones, :_destroy
        ],
        :region_ids => [],
        :frontera_ids => [],
      )
    end
end
