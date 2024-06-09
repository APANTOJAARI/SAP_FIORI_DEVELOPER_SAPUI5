sap.ui.define(["./Methods"], function() {
    return {
    	//Methods for company controller
    	validateCompanies : function(ps_compid, ps_descr, oModelCompData, ps_editData) {
            if (ps_compid === "")
				return "Error: Ingresar código de la compañia.";
            
            if (ps_descr === "")
				return "Error: Ingresar descripción de la compañia.";
            
            var w_l_exist_data = "";
            if(ps_editData === ""){
	            for(var i = 0; i < oModelCompData.length; i++){
	            	if(ps_compid === oModelCompData[i]["comp_id"]){
	            		w_l_exist_data = "X";
	            		break;
	            	}
	            }
	            
	            if(w_l_exist_data === "X")
	            	return "Error: La compañia ingresada ya existe.";
            }
            
            return "";
        },
        
		//Methods for connection controller
		validateConnection : function(ps_compid, ps_connection_id, ps_connection_syst, 
									  ps_connection_url, ps_comunication_user, 
									  ps_comunication_pass, oModelConnData, ps_editData) {
			var myInteger = (/^-?\d*(\.\d+)?$/);
			
	        if (ps_compid === ""){
				return "Error: Seleccione una compañia válida.";
	        }
	        
	        if (ps_connection_id === ""){
				return "Error: Ingresar el ambiente SAP.";
	        }
	        
	        if (ps_connection_syst === ""){
				return "Error: Ingresar mandante SAP.";
	        }else {
				if( !ps_connection_syst.match(myInteger) )
					return "Error: El campo mandante debe ser numerico.";
	        }
	        
	        if (ps_connection_url === ""){
				return "Error: Ingresar dirección URL de conexión SAP.";
	        }
	        
	        if (ps_comunication_user === ""){
				return "Error: Ingresar usuario de comunicación SAP.";
	        }
	        
	        if (ps_comunication_pass === ""){
				return "Error: Ingresar contraseña de usuario de comunicación.";
	        }
	        
	        var w_l_exist_data = "";
	        if(ps_editData === ""){		        
	            for(var i = 0; i < oModelConnData.length; i++){
	            	if(ps_compid === oModelConnData[i]["comp_id"] &&
	            	   ps_connection_id === oModelConnData[i]["connection_id"] &&
	            	   ps_connection_syst === oModelConnData[i]["connection_syst"]){
	            		w_l_exist_data = "X";
	            		break;
	            	}
	            }
	            
	            if(w_l_exist_data === "X")
	            	return "Error: La conexión ingresada ya existe para la compañia seleccionada.";
	        }
	        
	        return "";
	    },

		//Methods for connection controller
	    validateEmailCopy : function(ps_compid, ps_prc_type, ps_email, oModelConnData, ps_editData) {
			var myInteger = (/^-?\d*(\.\d+)?$/);
	        var w_l_error_email = "";
	        var mailregex = /^\w+[\w-+\.]*\@\w+([-\.]\w+)*\.[a-zA-Z]{2,}$/;
	        var w_l_arrayEmail;
	        var w_l_num_for = 0;
	        
	        if (ps_compid === ""){
				return "Error: Seleccione una compañia válida.";
	        }
	        
	        if (ps_prc_type === "")
				return "Error: Seleccione un parámetro válido.";
	        else{
	        	if(ps_prc_type === "MCHG" ||
	        	   ps_prc_type === "MULK"){
	        		w_l_arrayEmail = ps_email.split(";", 30);
	        		
	    	        for(var i = 0; i < w_l_arrayEmail.length; i++){
	    	        	w_l_num_for = i;
	    	        	if (!mailregex.test(w_l_arrayEmail[i].trim())) {
	    	        		w_l_error_email = "X";
	    	        		break;
	    	        	}
	    	        }
	        	} else if (ps_prc_type === "TUCHG" ||
	        			   ps_prc_type === "TUULK"){
	        		w_l_arrayEmail = ps_email.split(";", 30);
	        		
	        		if(w_l_arrayEmail.length > 5){
	        			return "Error: Los valores del tipo de usuario no pueden ser mas de 5.";
	        		} else {
		    	        for(var i = 0; i < w_l_arrayEmail.length; i++){
		    	        	w_l_num_for = i;
		    	        	if (w_l_arrayEmail[i].trim() !== "A" &&
		    	        		w_l_arrayEmail[i].trim() !== "B" &&
		    	        		w_l_arrayEmail[i].trim() !== "C" &&
		    	        		w_l_arrayEmail[i].trim() !== "L" &&
		    	        		w_l_arrayEmail[i].trim() !== "S") {
		    	        		w_l_error_email = "X";
		    	        		break;
		    	        	}
		    	        }
	        		}
	        	} else if (ps_prc_type === "AGM"){
	        		w_l_arrayEmail = ps_email.split(";", 30);
	        		
	        		if(w_l_arrayEmail.length > 3)
	        			return "Error: Los valores para activar/desactivar los gráficos no pueden ser mas de 3.";
	        		else{
	        			for(var i = 0; i < w_l_arrayEmail.length; i++){
		    	        	w_l_num_for = i;
		    	        	if (w_l_arrayEmail[i].trim() !== "SOL" &&
		    	        		w_l_arrayEmail[i].trim() !== "TRANS" &&
		    	        		w_l_arrayEmail[i].trim() !== "USR" &&
		    	        		w_l_arrayEmail[i].trim() !== "") {
		    	        		w_l_error_email = "X";
		    	        		break;
		    	        	}
		    	        }
	        		}
	        	} else if (ps_prc_type === "PAUDI"){
	        		w_l_arrayEmail = ps_email.split(";", 30);
	        		
	        		if(w_l_arrayEmail.length > 4)
	        			return "Error: Los valores para el reporte de auditoría no pueden ser mas de 4.";
	        		else if (w_l_arrayEmail.length > 1 && w_l_arrayEmail.length < 4){
	        			return "Error: Debe ingresar todos los valores válidos (Dominio, Usuario y Contraseña).";
	        		} else if (w_l_arrayEmail.length === 4){
	        			if (w_l_arrayEmail[1].trim() !== "" ||
	        				w_l_arrayEmail[2].trim() !== "" ||
	        				w_l_arrayEmail[3].trim() !== "") {
	        				if (w_l_arrayEmail[1].trim() === "" ||
	    	        			w_l_arrayEmail[2].trim() === "" ||
	    	        			w_l_arrayEmail[3].trim() === "") {
	        					return "Error: El dominio, usuario y/o contraseña no pueden ser valores vacíos.";
	    		    	    }
		    	        }
	        		}
	        	} else if (ps_prc_type === "CLCLI" ||
	        			   ps_prc_type === "OPCLI"){
	        		w_l_arrayEmail = ps_email.split(";", 30);
	        		
	        		if(w_l_arrayEmail.length > 4)
	        			return "Error: Los valores para el proceso de abrir o cerrar mandante no pueden ser mas de 4.";
	        		else if (w_l_arrayEmail.length < 4){
	        			return "Error: Debe ingresar todos los valores válidos mostrados en la ayuda.";
	        		} else if (w_l_arrayEmail.length === 4){
	        			if (w_l_arrayEmail[0].trim() === ""){
	        				return "El valor de la modificación y transporte objetos especificos mandante no puede ser vacío.";
	        			} else if(w_l_arrayEmail[0].trim() !== "1" &&
	        					  w_l_arrayEmail[0].trim() !== "2" &&
	        					  w_l_arrayEmail[0].trim() !== "3" &&
	        					  w_l_arrayEmail[0].trim() !== "9"){
	        				return "El valor de la modificación y transporte objetos especificos mandante no es válido, \n ver detalle para ver valores válidos.";
	        			}
	        			
	        			if(w_l_arrayEmail[1].trim() !== "1" &&
	        			   w_l_arrayEmail[1].trim() !== "2" &&
	        			   w_l_arrayEmail[1].trim() !== "3" &&
	        			   w_l_arrayEmail[1].trim() !== ""){
	        				return "El valor de las modificaciones de objetos válidos para todos los mandantes no es válido, \n ver detalle para ver valores válidos.";
	        			}
	        			
	        			if(w_l_arrayEmail[2].trim() !== "L" &&
	 	        		   w_l_arrayEmail[2].trim() !== "X" &&
	 	        		   w_l_arrayEmail[2].trim() !== ""){
	 	        			return "El valor de la protección p.programa para copiar mandantes y herramienta compar. no es válido, \n ver detalle para ver valores válidos.";
	 	        		}
	        			
	        			if(w_l_arrayEmail[3].trim() !== "F" &&
	 	 	        	   w_l_arrayEmail[3].trim() !== "T" &&
	 	 	        	   w_l_arrayEmail[3].trim() !== "X" &&
	 	 	        	   w_l_arrayEmail[3].trim() !== "E" &&
	 	 	        	   w_l_arrayEmail[3].trim() !== ""){
	 	 	        		return "El valor de las limitaciones al iniciar CATT y eCATT no es válido, \n ver detalle para ver valores válidos.";
	 	 	        	}
	        		}
	        	}
	        }
	        
	        if(w_l_error_email === "X"){
	        	if(ps_prc_type === "MCHG" ||
	        	   ps_prc_type === "MULK"){
	        		return "Error: El email " + w_l_arrayEmail[w_l_num_for] + " ingresado no es válido.";
 	        	} else if (ps_prc_type === "TUCHG" ||
 	        			   ps_prc_type === "TUULK"){
 	        		return "Error: El valor " + w_l_arrayEmail[w_l_num_for] + " ingresado no es válido.";
 	        	} else if (ps_prc_type === "AGM"){
 	        		return "Error: El valor " + w_l_arrayEmail[w_l_num_for] + " ingresado no es válido.";
 	        	}
	        }
	        
	        if (ps_email === "" && (ps_prc_type !== "AGM" && ps_prc_type !== "DSPPS"))
				return "Error: Ingrese un valor válido.";
	        
	        var w_l_exist_data = "";
	        if(ps_editData === ""){		        
	            for(var i = 0; i < oModelConnData.length; i++){
	            	if(ps_compid === oModelConnData[i]["comp_id"] &&
	            	   ps_prc_type === oModelConnData[i]["param_id"]){
	            		w_l_exist_data = "X";
	            		break;
	            	}
	            }
	            
	            if(w_l_exist_data === "X")
	            	return "Error: El valor del parámetro ingresado ya existe para la compañia seleccionada.";
	        }
	        
	        return "";
	    },
	    
		//Methods for user controller
		validateUser : function(ps_comp_id, ps_user_name, ps_user_firstname, 
								ps_user_lastname, ps_user_phone, ps_user_mail, 
								ps_user_pass, oModelUserData, ps_editData) {
			var myInteger = (/^-?\d*(\.\d+)?$/);
			
	        if (ps_comp_id === ""){
				return "Error: Seleccione una compañia válida.";
	        }
	        
	        if (ps_user_name === ""){
				return "Error: Ingresar el usuario.";
	        }
	        
	        if (ps_user_firstname === ""){
				return "Error: Ingresar el nombre.";
	        }
	        
	        if (ps_user_lastname === ""){
				return "Error: Ingresar el apellido.";
	        }
	        
	        if (ps_user_phone === ""){
	        	return "Error: Ingresar el teléfono.";
	        } else {
	        	if( !ps_user_phone.match(myInteger) )
					return "Error: El campo teléfono debe ser numerico.";
	        }
	        
	        if (ps_user_mail === ""){
				return "Error: Ingresar el E-Mail.";
	        }
	        
	        var w_l_error_email = "";
	        var mailregex = /^\w+[\w-+\.]*\@\w+([-\.]\w+)*\.[a-zA-Z]{2,}$/;
	        
	    	if (!mailregex.test(ps_user_mail.trim()))
	    		return "Error: El email " + ps_user_mail + " ingresado no es válido";
	        
	        if (ps_user_pass === ""){
	        	return "Error: Ingresar la contraseña.";
	        }
	        
	        var w_l_exist_data = "";
	        if(ps_editData === ""){		        
	            for(var i = 0; i < oModelUserData.length; i++){
	            	if(ps_comp_id === oModelUserData[i]["comp_id"] &&
	            	   ps_user_name === oModelUserData[i]["user_name"]){
	            		w_l_exist_data = "X";
	            		break;
	            	}
	            }
	            
	            if(w_l_exist_data === "X")
	            	return "Error: El usuario ingresado ya existe para la compañia seleccionada.";
	        }
	        
	        return "";
	    },
	    
		//Methods for target connection controller
	    validateTargetConnection : function(ps_comp_id, ps_source_conn, 
				   							ps_target_conn, oModelTrgConnData) {

	    	if (ps_comp_id === ""){
				return "Error: Seleccione una compañia válida.";
	        }
	        
	        if (ps_source_conn === ""){
				return "Error: Seleccione un ambiente SAP (Origen) válido.";
	        }
	        
	        if (ps_target_conn === ""){
				return "Error: Seleccione un ambiente SAP (Destino) válido.";
	        }
	        
	        if (ps_source_conn === ps_target_conn){
				return "Error: El ambiente SAP (Origen) no puede ser igual que el ambiente SAP (Destino).";
	        }
	        
	        var w_l_exist_data = "";	        
            for(var i = 0; i < oModelTrgConnData.length; i++){
            	if(ps_comp_id === oModelTrgConnData[i]["comp_id"] &&
            	   ps_source_conn === oModelTrgConnData[i]["conn_source"] &&
            	   ps_target_conn === oModelTrgConnData[i]["conn_target"]){
            		w_l_exist_data = "X";
            		break;
            	}
            }
            
            if(w_l_exist_data === "X")
            	return "Error: El ambiente SAP (Destino) ingresado ya existe para la compañia seleccionada.";
	        
	        return "";
	    },
	    
		//Methods for users by connection controller
	    validateOptionxUser : function(ps_comp_id, ps_user_name,
	    							   oModelUnAssignData, oModelAssignData) {

	    	if (ps_comp_id === ""){
				return "Error: Seleccione una compañia válida.";
	        }
	        
	        if (ps_user_name === ""){
				return "Error: Seleccione un usuario válido.";
	        }
	        
	        if(oModelUnAssignData.length === 0 &&
	           oModelAssignData.length === 0){
	        	return "Error: No existen ambientes SAP para la compañia " + ps_comp_text + ".";
	        }
	        
	        if(oModelUnAssignData.length === undefined && oModelAssignData.length === undefined)
	        	return "Error: No existen ambientes SAP para la compañia " + ps_comp_text + ".";
	        
	        return "";
	    },
	    
		//Methods for users by connection controller
	    validateOptionxCompany : function(ps_comp_id,
	    							   oModelUnAssignData, oModelAssignData) {

	    	if (ps_comp_id === ""){
				return "Error: Seleccione una compañia válida.";
	        }
	        
	        if(oModelUnAssignData.length === 0 &&
	           oModelAssignData.length === 0){
	        	return "Error: No existen ambientes SAP para la compañia " + ps_comp_text + ".";
	        }
	        
	        if(oModelUnAssignData.length === undefined && oModelAssignData.length === undefined)
	        	return "Error: No existen ambientes SAP para la compañia " + ps_comp_text + ".";
	        
	        return "";
	    },
	    
		//Methods for users by connection controller
	    validateUserxConnection : function(ps_comp_id, ps_user_name, ps_conn_id,
	    								   oModelUCUnAssignData, oModelUCAssignData) {

	    	if (ps_comp_id === ""){
				return "Error: Seleccione una compañia válida.";
	        }
	        
	        if (ps_user_name === ""){
				return "Error: Seleccione un usuario válido.";
	        }
	        
	        if (ps_conn_id === ""){
				return "Error: Seleccione un ambiente SAP (Origen) válido.";
	        }
	        
	        if(oModelUCUnAssignData.length === 0 &&
	           oModelUCAssignData.length === 0){
	        	return "Error: No existen ambientes SAP para la compañia " + ps_comp_text + ".";
	        }
	        
	        if(oModelUCUnAssignData.length === undefined && oModelUCAssignData.length === undefined)
	        	return "Error: No existen ambientes SAP para la compañia " + ps_comp_text + ".";
	        
	        return "";
	    },
	    
		//Methods for request controller
	    validateRequest : function(ps_comp_id, ps_req_name, ps_user_name, ps_req_email, ps_chkInm, 
	    						   ps_shd_date, ps_shd_hour, ps_shd_date_dt,
								   ps_to_date, ps_ext_nro, oTargetConn,
	    						   oModelTransportDetData){
	    	
	    	var myInteger = (/^-?\d*(\.\d+)?$/);
	    	
	    	var w_l_to_date;
			var w_l_to_hour;
			
			var w_l_sch_date;

	    	if (ps_comp_id === ""){
				return "Error: Seleccione una compañia válida.";
	        }
	        
	        if (ps_user_name === ""){
				return "Error: Seleccione un usuario válido.";
	        }
	        
	        if (ps_req_name === ""){
				return "Error: Ingrese una descripción.";
	        }
	        
	        if (ps_chkInm === ""){
		    	w_l_to_date = ps_to_date.toLocaleDateString();
				w_l_to_hour = ps_to_date.toLocaleTimeString();
				
				if(ps_shd_date_dt !== null)
					w_l_sch_date = ps_shd_date_dt.toLocaleDateString();
				
	        	if(ps_shd_date === "")
	        		return "Error: Seleccione una fecha de programación válida.";
	        	
	        	if(ps_shd_hour === "")
	        		return "Error: Seleccione una hora de programación válida.";
	        	
	        	if (w_l_to_date === w_l_sch_date){
	        		if(ps_shd_hour.substring(0, 2) < w_l_to_hour.substring(0, 2)){
	        			return "Error: La hora de programación tiene que ser mayor igual a la hora del día.";
	        		} else if(ps_shd_hour.substring(0, 2) === w_l_to_hour.substring(0, 2)) {
	        			if(ps_shd_hour.substring(3, 5) < w_l_to_hour.substring(3, 5))
	        				return "Error: La hora de programación tiene que ser mayor igual a la hora del día.";
	        			else if (ps_shd_hour.substring(3, 5) === w_l_to_hour.substring(3, 5)){
	        				if(ps_shd_hour.substring(6, 10) < w_l_to_hour.substring(6, 10))
	        					return "Error: La hora de programación tiene que ser mayor igual a la hora del día.";
	        			}
	        		}
	        	} else {
		        	if (ps_shd_date_dt < ps_to_date)
		        		return "Error: La fecha de programación tiene que ser mayor igual a la fecha del día.";
	        	}
	        }
	        
	        var w_l_error_email = "";
	        var w_l_num_for = 0;
	        var mailregex = /^\w+[\w-+\.]*\@\w+([-\.]\w+)*\.[a-zA-Z]{2,}$/;
	        var w_l_arrayEmail = ps_req_email.split(";", 30);
	        
	        for(var i = 0; i < w_l_arrayEmail.length; i++){
	        	w_l_num_for = i;
	        	if (!mailregex.test(w_l_arrayEmail[i].trim())) {
	        		w_l_error_email = "X";
	        		break;
	        	}
	        }
	        
	        if(w_l_error_email === "X")
	        	return "Error: El email " + w_l_arrayEmail[w_l_num_for] + " ingresado no es válido";
	        
	        if (oTargetConn === undefined || oTargetConn.length === 0)
	        	return "Error: Seleccione un ambiente destino válido.";

	        if (oModelTransportDetData === undefined || oModelTransportDetData.length === 0)
	        	return "Error: Debe generar una solicitud con al menos un transporte SAP.";
	        else if (oModelTransportDetData.length > 20)
	        	return "Error: No se pueden transportar mas de 20 ordenes de transporte SAP.";

	        return "";
	    },
	    
		//Methods for request controller
	    validateGestionUser : function(ps_comp_id, ps_conn_id){
	    	
	    	if (ps_comp_id === ""){
				return "Error: Seleccione una compañia válida.";
	        }
	        
	        if (ps_conn_id === ""){
				return "Error: Seleccione un ambiente SAP válido.";
	        }

	        return "";
	    }
        ///////////////////////////////
    };
});