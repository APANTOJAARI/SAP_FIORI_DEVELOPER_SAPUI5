/*!
 * OpenUI5
 * (c) Copyright 2009-2020 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(['./SinglePlanningCalendarUtilities','sap/ui/core/Control','sap/ui/core/LocaleData','sap/ui/core/Locale','sap/ui/core/InvisibleText','sap/ui/core/format/DateFormat','sap/ui/core/date/UniversalDate','sap/ui/core/dnd/DragInfo','sap/ui/core/dnd/DropInfo','sap/ui/core/dnd/DragDropInfo','sap/ui/unified/library','sap/ui/unified/CalendarAppointment','sap/ui/unified/calendar/DatesRow','sap/ui/unified/calendar/CalendarDate','sap/ui/unified/calendar/CalendarUtils','sap/ui/events/KeyCodes','./SinglePlanningCalendarGridRenderer','sap/ui/Device','sap/ui/core/delegate/ItemNavigation',"sap/ui/thirdparty/jquery",'./PlanningCalendarLegend'],function(S,C,L,a,I,D,U,b,c,d,u,e,f,g,h,K,k,l,m,q,P){"use strict";var R=69,n=48,B=34,o=25,H=3600000/2,O=60*1000,M=86400000,p=7,F=0,r=24;var s=C.extend("sap.m.SinglePlanningCalendarGrid",{metadata:{library:"sap.m",properties:{startDate:{type:"object",group:"Data"},startHour:{type:"int",group:"Data",defaultValue:0},endHour:{type:"int",group:"Data",defaultValue:24},fullDay:{type:"boolean",group:"Data",defaultValue:true},enableAppointmentsDragAndDrop:{type:"boolean",group:"Misc",defaultValue:false},enableAppointmentsResize:{type:"boolean",group:"Misc",defaultValue:false},enableAppointmentsCreate:{type:"boolean",group:"Misc",defaultValue:false}},aggregations:{appointments:{type:"sap.ui.unified.CalendarAppointment",multiple:true,singularName:"appointment",dnd:{draggable:true}},specialDates:{type:"sap.ui.unified.DateTypeRange",multiple:true,singularName:"specialDate"},_columnHeaders:{type:"sap.ui.unified.calendar.DatesRow",multiple:false,visibility:"hidden"},_intervalPlaceholders:{type:"sap.m.SinglePlanningCalendarGrid._internal.IntervalPlaceholder",multiple:true,visibility:"hidden",dnd:{droppable:true}},_blockersPlaceholders:{type:"sap.m.SinglePlanningCalendarGrid._internal.IntervalPlaceholder",multiple:true,visibility:"hidden",dnd:{droppable:true}}},dnd:true,associations:{ariaLabelledBy:{type:"sap.ui.core.Control",multiple:true,singularName:"ariaLabelledBy"},legend:{type:"sap.m.PlanningCalendarLegend",multiple:false}},events:{appointmentSelect:{parameters:{appointment:{type:"sap.ui.unified.CalendarAppointment"},appointments:{type:"sap.ui.unified.CalendarAppointment[]"}}},appointmentDrop:{parameters:{appointment:{type:"sap.ui.unified.CalendarAppointment"},startDate:{type:"object"},endDate:{type:"object"},copy:{type:"boolean"}}},appointmentResize:{parameters:{appointment:{type:"sap.ui.unified.CalendarAppointment"},startDate:{type:"object"},endDate:{type:"object"}}},appointmentCreate:{parameters:{startDate:{type:"object"},endDate:{type:"object"}}},cellPress:{parameters:{startDate:{type:"object"},endDate:{type:"object"}}}}}});s.prototype.init=function(){var i=new Date(),j=new f(this.getId()+"-columnHeaders",{showDayNamesLine:false,showWeekNumbers:false,startDate:i}).addStyleClass("sapMSinglePCColumnHeader"),w=(60-i.getSeconds())*1000,T=this._getCoreLocaleData().getTimePattern("medium");this.setAggregation("_columnHeaders",j);this.setStartDate(i);this._setColumns(7);this._configureBlockersDragAndDrop();this._configureAppointmentsDragAndDrop();this._configureAppointmentsResize();this._configureAppointmentsCreate();this._oUnifiedRB=sap.ui.getCore().getLibraryResourceBundle("sap.ui.unified");this._oFormatStartEndInfoAria=D.getDateTimeInstance({pattern:"EEEE dd/MM/YYYY 'at' "+T});this._oFormatAriaFullDayCell=D.getDateTimeInstance({pattern:"EEEE dd/MM/YYYY"});this._sLegendId=undefined;setTimeout(this._updateRowHeaderAndNowMarker.bind(this),w);};s.prototype.exit=function(){if(this._oItemNavigation){this.removeDelegate(this._oItemNavigation);this._oItemNavigation.destroy();delete this._oItemNavigation;}};s.prototype.onBeforeRendering=function(){var A=this._createAppointmentsMap(this.getAppointments()),i=this.getStartDate(),j=g.fromLocalJSDate(i),w=this._getColumns();this._oVisibleAppointments=this._calculateVisibleAppointments(A.appointments,this.getStartDate(),w);this._oAppointmentsToRender=this._calculateAppointmentsLevelsAndWidth(this._oVisibleAppointments);this._aVisibleBlockers=this._calculateVisibleBlockers(A.blockers,j,w);this._oBlockersToRender=this._calculateBlockersLevelsAndWidth(this._aVisibleBlockers);if(this._iOldColumns!==w||this._oOldStartDate!==i){this._createBlockersDndPlaceholders(i,w);this._createAppointmentsDndPlaceholders(i,w);}};s.prototype.onmousedown=function(E){var i=E.target.classList;this._isResizeHandleBottomMouseDownTarget=i.contains("sapMSinglePCAppResizeHandleBottom");this._isResizeHandleTopMouseDownTarget=i.contains("sapMSinglePCAppResizeHandleTop");};s.prototype._isResizingPerformed=function(){return this._isResizeHandleBottomMouseDownTarget||this._isResizeHandleTopMouseDownTarget;};s.prototype._configureBlockersDragAndDrop=function(){this.addDragDropConfig(new d({sourceAggregation:"appointments",targetAggregation:"_blockersPlaceholders",dragStart:function(E){if(!this.getEnableAppointmentsDragAndDrop()){E.preventDefault();return false;}var i=function(){var $=q(".sapMSinglePCOverlay");setTimeout(function(){$.addClass("sapMSinglePCOverlayDragging");});q(document).one("dragend",function(){$.removeClass("sapMSinglePCOverlayDragging");});};i();}.bind(this),dragEnter:function(E){var i=E.getParameter("dragSession"),A=i.getDragControl(),j=i.getDropControl(),w=this.isAllDayAppointment(A.getStartDate(),A.getEndDate()),x=function(){var $=q(i.getIndicator()),y=A.$().outerHeight(),z=A.$().outerWidth(),G=j.$().closest(".sapMSinglePCBlockersColumns").get(0).getBoundingClientRect(),J=j.getDomRef().getBoundingClientRect(),N=(J.left+z)-(G.left+G.width);if(w){$.css("min-height",y);$.css("min-width",Math.min(z,z-N));}else{$.css("min-height",i.getDropControl().$().outerHeight());$.css("min-width",i.getDropControl().$().outerWidth());}};if(!i.getIndicator()){setTimeout(x,0);}else{x();}}.bind(this),drop:function(E){var i=E.getParameter("dragSession"),A=i.getDragControl(),j=i.getDropControl(),w=j.getDate().getJSDate(),x,y=E.getParameter("browserEvent"),z=(y.metaKey||y.ctrlKey),G=this.isAllDayAppointment(A.getStartDate(),A.getEndDate());x=new Date(w);if(G){x.setMilliseconds(A.getEndDate().getTime()-A.getStartDate().getTime());}this.$().find(".sapMSinglePCOverlay").removeClass("sapMSinglePCOverlayDragging");if(G&&A.getStartDate().getTime()===w.getTime()){return;}this.fireAppointmentDrop({appointment:A,startDate:w,endDate:x,copy:z});}.bind(this)}));};s.prototype._configureAppointmentsDragAndDrop=function(){this.addDragDropConfig(new d({sourceAggregation:"appointments",targetAggregation:"_intervalPlaceholders",dragStart:function(E){if(!this.getEnableAppointmentsDragAndDrop()||this._isResizingPerformed()){E.preventDefault();return false;}var i=function(){var $=q(".sapMSinglePCOverlay");setTimeout(function(){$.addClass("sapMSinglePCOverlayDragging");});q(document).one("dragend",function(){$.removeClass("sapMSinglePCOverlayDragging");});};i();}.bind(this),dragEnter:function(E){var i=E.getParameter("dragSession"),A=i.getDragControl(),j=i.getDropControl(),w=this.isAllDayAppointment(A.getStartDate(),A.getEndDate()),x=function(){var $=q(i.getIndicator()),y=A.$().outerHeight(),G=j.$().closest(".sapMSinglePCColumn").get(0).getBoundingClientRect(),z=i.getDropControl().getDomRef().getBoundingClientRect(),J=(z.top+y)-(G.top+G.height);if(w){$.css("min-height",2*i.getDropControl().$().outerHeight());}else{$.css("min-height",Math.min(y,y-J));}};if(!i.getIndicator()){setTimeout(x,0);}else{x();}}.bind(this),drop:function(E){var i=E.getParameter("dragSession"),A=i.getDragControl(),j=i.getDropControl(),w=j.getDate().getJSDate(),x,y=E.getParameter("browserEvent"),z=(y.metaKey||y.ctrlKey),G=this.isAllDayAppointment(A.getStartDate(),A.getEndDate());x=new Date(w);if(G){x.setHours(x.getHours()+1);}else{x.setMilliseconds(A.getEndDate().getTime()-A.getStartDate().getTime());}this.$().find(".sapMSinglePCOverlay").removeClass("sapMSinglePCOverlayDragging");if(!G&&A.getStartDate().getTime()===w.getTime()){return;}this.fireAppointmentDrop({appointment:A,startDate:w,endDate:x,copy:z});}.bind(this)}));};s.prototype._configureAppointmentsResize=function(){var i=new d({sourceAggregation:"appointments",targetAggregation:"_intervalPlaceholders",dragStart:function(E){if(!this.getEnableAppointmentsResize()||!this._isResizingPerformed()){E.preventDefault();return;}var j=E.getParameter("dragSession"),$=this.$().find(".sapMSinglePCOverlay"),w=q(j.getIndicator()),x=j.getDragControl().$();if(this._isResizeHandleBottomMouseDownTarget){j.setData("bottomHandle","true");}if(this._isResizeHandleTopMouseDownTarget){j.setData("topHandle","true");}w.addClass("sapUiDnDIndicatorHide");setTimeout(function(){$.addClass("sapMSinglePCOverlayDragging");},0);q(document).one("dragend",function(){var A=j.getComplexData("appointmentStartingBoundaries");$.removeClass("sapMSinglePCOverlayDragging");w.removeClass("sapUiDnDIndicatorHide");x.css({top:A.top,height:A.height,"z-index":"auto",opacity:1});});if(!l.browser.msie&&!l.browser.edge){E.getParameter("browserEvent").dataTransfer.setDragImage(t(),0,0);}}.bind(this),dragEnter:function(E){var j=E.getParameter("dragSession"),A=j.getDragControl().$().get(0),w=j.getDropControl().getDomRef(),x=j.getComplexData("appointmentStartingBoundaries"),y=function(){var $=q(j.getIndicator());$.addClass("sapUiDnDIndicatorHide");},T,z,G,V,J;if(!x){x={top:A.offsetTop,bottom:A.offsetTop+A.getBoundingClientRect().height,height:A.getBoundingClientRect().height};j.setComplexData("appointmentStartingBoundaries",x);}V=j.getData("bottomHandle")?x.top:x.bottom;T=Math.min(V,w.offsetTop);z=Math.max(V,w.offsetTop+w.getBoundingClientRect().height);G=z-T;J={top:T,height:G,"z-index":1,opacity:0.8};j.getDragControl().$().css(J);if(!j.getIndicator()){setTimeout(y,0);}else{y();}},drop:function(E){var j=E.getParameter("dragSession"),A=j.getDragControl(),w=this.indexOfAggregation("_intervalPlaceholders",j.getDropControl()),x=j.getComplexData("appointmentStartingBoundaries"),y;y=this._calcResizeNewHoursAppPos(A.getStartDate(),A.getEndDate(),w,j.getData("bottomHandle"));this.$().find(".sapMSinglePCOverlay").removeClass("sapMSinglePCOverlayDragging");q(j.getIndicator()).removeClass("sapUiDnDIndicatorHide");A.$().css({top:x.top,height:x.height,"z-index":"auto",opacity:1});if(A.getEndDate().getTime()===y.endDate.getTime()&&A.getStartDate().getTime()===y.startDate.getTime()){return;}this.fireAppointmentResize({appointment:A,startDate:y.startDate,endDate:y.endDate});}.bind(this)});this.addDragDropConfig(i);};s.prototype._configureAppointmentsCreate=function(){this.addDragDropConfig(new d({targetAggregation:"_intervalPlaceholders",dragStart:function(E){if(!this.getEnableAppointmentsCreate()){E.preventDefault();return;}var $=this.$().find(".sapMSinglePCOverlay");setTimeout(function(){$.addClass("sapMSinglePCOverlayDragging");});q(document).one("dragend",function(){$.removeClass("sapMSinglePCOverlayDragging");q(".sapUiAppCreate").remove();q(".sapUiDnDDragging").removeClass("sapUiDnDDragging");});if(!l.browser.msie&&!l.browser.edge){E.getParameter("browserEvent").dataTransfer.setDragImage(t(),0,0);}}.bind(this),dragEnter:function(E){var i=E.getParameter("dragSession"),j=i.getDropControl(),w=j.getDomRef(),x=w.offsetHeight,y=w.offsetTop,z=y,A=w.getBoundingClientRect().left,G=A,J=j.$().parents(".sapMSinglePCColumn").get(0),$=q(".sapUiAppCreate");if(!$.get(0)){$=q("<div></div>").addClass("sapUiCalendarApp sapUiCalendarAppType01 sapUiAppCreate");$.appendTo(J);}q(".sapUiDnDDragging").removeClass("sapUiDnDDragging");if(!i.getComplexData("startingRectsDropArea")){i.setComplexData("startingRectsDropArea",{top:y,left:A});i.setComplexData("startingDropDate",j.getDate());}else{z=i.getComplexData("startingRectsDropArea").top;G=i.getComplexData("startingRectsDropArea").left;}if(A!==G){E.preventDefault();return false;}j.$().closest(".sapMSinglePCColumn").find(".sapMSinglePCAppointments").addClass("sapUiDnDDragging");$.css({top:Math.min(z,y)+2,height:Math.abs(z-y)+x-4,left:3,right:3,"z-index":2});i.setIndicatorConfig({display:"none"});},drop:function(E){var i=E.getParameter("dragSession"),j=i.getDropControl(),T=30*60*1000,w=i.getComplexData("startingDropDate").getTime(),x=j.getDate().getJSDate().getTime(),y=Math.min(w,x),z=Math.max(w,x)+T;this.fireAppointmentCreate({startDate:new Date(y),endDate:new Date(z)});q(".sapUiAppCreate").remove();q(".sapUiDnDDragging").removeClass("sapUiDnDDragging");}.bind(this)}));};s.prototype._calcResizeNewHoursAppPos=function(A,i,j,w){var x=new Date(this.getStartDate().getFullYear(),this.getStartDate().getMonth(),this.getStartDate().getDate()),y=30*60*1000,z=x.getTime()+j*y,E=z+y,V=w?A.getTime():i.getTime(),G=Math.min(V,z),J=Math.max(V,E);return{startDate:new Date(G),endDate:new Date(J)};};s.prototype._adjustAppointmentsHeightforCompact=function(i,j,w){var A,$,x,y,z,E,G,J,N=this._getRowHeight(),Q=this;if(this._oAppointmentsToRender[i]){this._oAppointmentsToRender[i].oAppointmentsList.getIterator().forEach(function(T){A=T.getData();$=q("div[data-sap-day='"+i+"'].sapMSinglePCColumn #"+A.getId());x=A.getStartDate();y=A.getEndDate();G=j.getTime()>x.getTime();J=w.getTime()<y.getTime();z=G?0:Q._calculateTopPosition(x);E=J?0:Q._calculateBottomPosition(y);$.css("top",z);$.css("bottom",E);$.find(".sapUiCalendarApp").css("min-height",N/2-3);});}};s.prototype._adjustBlockersHeightforCompact=function(){var i=this._getBlockersToRender().iMaxlevel,j=(i+1)*this._getBlockerRowHeight(),w=this._getColumns()===1?j+p:j,x=this._getBlockerRowHeight();if(i>0){w=w+3;}this.$().find(".sapMSinglePCBlockersColumns").css("height",w);this._oBlockersToRender.oBlockersList.getIterator().forEach(function(y){y.getData().$().css("top",x*y.level+1);});};s.prototype._adjustBlockersHeightforCozy=function(){var i=this._getBlockersToRender()&&this._getBlockersToRender().iMaxlevel,j;if(this._getColumns()===1){j=(i+1)*this._getBlockerRowHeight();this.$().find(".sapMSinglePCBlockersColumns").css("height",j+p);}};s.prototype.onAfterRendering=function(){var j=this._getColumns(),w=this.getStartDate(),x=this._getRowHeight();if(x===n){for(var i=0;i<j;i++){var y=new g(w.getFullYear(),w.getMonth(),w.getDate()+i),z=this._getDateFormatter().format(y.toLocalJSDate()),A=new U(y.getYear(),y.getMonth(),y.getDate(),this._getVisibleStartHour()),E=new U(y.getYear(),y.getMonth(),y.getDate(),this._getVisibleEndHour(),59,59);this._adjustAppointmentsHeightforCompact(z,A,E);}this._adjustBlockersHeightforCompact();}else{this._adjustBlockersHeightforCozy();}this._updateRowHeaderAndNowMarker();_.call(this);};s.prototype._appFocusHandler=function(E,i){var T=sap.ui.getCore().byId(E.target.id);if(T&&T.isA("sap.ui.unified.CalendarAppointment")){this.fireAppointmentSelect({appointment:undefined,appointments:this._toggleAppointmentSelection(undefined,true)});this._focusCellWithKeyboard(T,i);E.preventDefault();}};s.prototype._cellFocusHandler=function(E,i){var G=E.target,j=this._getDateFormatter(),w;if(G.classList.contains("sapMSinglePCRow")||G.classList.contains("sapMSinglePCBlockersColumn")){w=j.parse(G.getAttribute("data-sap-start-date"));if(this._isBorderReached(w,i)){this.fireEvent("borderReached",{startDate:w,next:i===K.ARROW_RIGHT,fullDay:G.classList.contains("sapMSinglePCBlockersColumn")});}}};s.prototype.onsapup=function(E){this._appFocusHandler(E,K.ARROW_UP);};s.prototype.onsapdown=function(E){this._appFocusHandler(E,K.ARROW_DOWN);};s.prototype.onsapright=function(E){this._appFocusHandler(E,K.ARROW_RIGHT);this._cellFocusHandler(E,K.ARROW_RIGHT);};s.prototype.onsapleft=function(E){this._appFocusHandler(E,K.ARROW_LEFT);this._cellFocusHandler(E,K.ARROW_LEFT);};s.prototype.setStartDate=function(i){this._oOldStartDate=this.getStartDate();this.getAggregation("_columnHeaders").setStartDate(i);return this.setProperty("startDate",i);};s.prototype.applyFocusInfo=function(w){var V=this._getVisibleBlockers(),x=this._getVisibleAppointments(),y=Object.keys(x),z,i,j;for(i=0;i<V.length;++i){if(V[i].getId()===w.id){V[i].focus();return this;}}for(i=0;i<y.length;++i){z=x[y[i]];for(j=0;j<z.length;++j){if(z[j].getId()===w.id){z[j].focus();return this;}}}return this;};s.prototype.getSelectedAppointments=function(){return this.getAppointments().filter(function(A){return A.getSelected();});};s.prototype._toggleAppointmentSelection=function(A,j){var w=[],x,y,i;if(j){x=this.getAppointments();for(i=0,y=x.length;i<y;i++){if((!A||x[i].getId()!==A.getId())&&x[i].getSelected()){x[i].setProperty("selected",false,true);w.push(x[i]);q('[data-sap-ui='+x[i].getId()+']').attr("aria-selected","false").find(".sapUiCalendarApp").removeClass("sapUiCalendarAppSel");}}}if(A){A.setProperty("selected",!A.getSelected(),true);w.push(A);q('[data-sap-ui='+A.getId()+']').attr("aria-selected",A.getSelected()).find(".sapUiCalendarApp").toggleClass("sapUiCalendarAppSel",A.getSelected());}return w;};s.prototype._isBorderReached=function(i,j){var G=g.fromLocalJSDate(this.getStartDate()),w=new g(G.getYear(),G.getMonth(),G.getDate()+this._getColumns()-1),T=g.fromLocalJSDate(i),x=j===K.ARROW_LEFT&&T.isSame(G),y=j===K.ARROW_RIGHT&&T.isSame(w);return x||y;};s.prototype._focusCellWithKeyboard=function(A,i){var j=this.isAllDayAppointment(A.getStartDate(),A.getEndDate()),w=this._getDateFormatter(),x=new Date(A.getStartDate().getFullYear(),A.getStartDate().getMonth(),A.getStartDate().getDate(),A.getStartDate().getHours()),G=new Date(this.getStartDate().getFullYear(),this.getStartDate().getMonth(),this.getStartDate().getDate(),this.getStartDate().getHours());if(x<G){x=G;}if(this._isBorderReached(x,i)){this.fireEvent("borderReached",{startDate:x,next:i===K.ARROW_RIGHT,fullDay:j});return;}switch(i){case K.ARROW_UP:if(!j){x.setHours(x.getHours()-1);}break;case K.ARROW_DOWN:if(!j){x.setHours(x.getHours()+1);}break;case K.ARROW_LEFT:x.setDate(x.getDate()-1);break;case K.ARROW_RIGHT:x.setDate(x.getDate()+1);break;default:}if(j&&i!==K.ARROW_DOWN){q("[data-sap-start-date='"+w.format(x)+"'].sapMSinglePCBlockersColumn").focus();}else{q("[data-sap-start-date='"+w.format(x)+"'].sapMSinglePCRow").focus();}};s.prototype.ontap=function(E){this._fireSelectionEvent(E);};s.prototype.onkeydown=function(E){if(E.which===K.SPACE||E.which===K.ENTER){this._fireSelectionEvent(E);E.preventDefault();}};s.prototype._fireSelectionEvent=function(E){var A=E.srcControl,G=E.target;if(E.target.classList.contains("sapMSinglePCRow")||E.target.classList.contains("sapMSinglePCBlockersColumn")){this.fireEvent("cellPress",{startDate:this._getDateFormatter().parse(G.getAttribute("data-sap-start-date")),endDate:this._getDateFormatter().parse(G.getAttribute("data-sap-end-date"))});this.fireAppointmentSelect({appointment:undefined,appointments:this._toggleAppointmentSelection(undefined,true)});}else if(A&&A.isA("sap.ui.unified.CalendarAppointment")){this.fireAppointmentSelect({appointment:A,appointments:this._toggleAppointmentSelection(A,!(E.ctrlKey||E.metaKey))});}};s.prototype._getVisibleStartHour=function(){return(this.getFullDay()||!this.getStartHour())?F:this.getStartHour();};s.prototype._getVisibleEndHour=function(){return((this.getFullDay()||!this.getEndHour())?r:this.getEndHour())-1;};s.prototype._isVisibleHour=function(i){var j=this.getStartHour(),E=this.getEndHour();if(!this.getStartHour()){j=F;}if(!this.getEndHour()){E=r;}return j<=i&&i<E;};s.prototype._shouldHideRowHeader=function(i){var j=new Date().getHours(),w=h._areCurrentMinutesLessThan(15)&&j===i,x=h._areCurrentMinutesMoreThan(45)&&j===i-1;return w||x;};s.prototype._parseDateStringAndHours=function(i,j){var w=this._getDateFormatter().parse(i);if(j){w.setHours(j);}return w;};s.prototype._getDateFormatter=function(){if(!(this._oDateFormat instanceof D)){this._oDateFormat=D.getDateTimeInstance({pattern:"YYYYMMdd-HHmm"});}return this._oDateFormat;};s.prototype._formatTimeAsString=function(i){var j=this._getHoursPattern()+":mm",w=D.getDateTimeInstance({pattern:j},new a(this._getCoreLocaleId()));return w.format(i);};s.prototype._addAMPM=function(i){var A=this._getAMPMFormat();return" "+A.format(i);};s.prototype._calculateTopPosition=function(i){var j=i.getHours()-this._getVisibleStartHour(),w=i.getMinutes(),x=this._getRowHeight();return Math.floor((x*j)+(x/60)*w);};s.prototype._calculateBottomPosition=function(i){var j=this._getVisibleEndHour()+1-i.getHours(),w=i.getMinutes(),x=this._getRowHeight();return Math.floor((x*j)-(x/60)*w);};s.prototype._updateRowHeaderAndNowMarker=function(){var i=new Date();this._updateNowMarker(i);this._updateRowHeaders(i);setTimeout(this._updateRowHeaderAndNowMarker.bind(this),O);};s.prototype._updateNowMarker=function(i){var $=this.$("nowMarker"),j=this.$("nowMarkerText"),w=this.$("nowMarkerAMPM"),x=!this._isVisibleHour(i.getHours());$.toggleClass("sapMSinglePCNowMarkerHidden",x);$.css("top",this._calculateTopPosition(i)+"px");j.text(this._formatTimeAsString(i));w.text(this._addAMPM(i));j.append(w);};s.prototype._updateRowHeaders=function(i){var $=this.$(),j=i.getHours(),N=j+1;$.find(".sapMSinglePCRowHeader").removeClass("sapMSinglePCRowHeaderHidden");if(this._shouldHideRowHeader(j)){$.find(".sapMSinglePCRowHeader"+j).addClass("sapMSinglePCRowHeaderHidden");}else if(this._shouldHideRowHeader(N)){$.find(".sapMSinglePCRowHeader"+N).addClass("sapMSinglePCRowHeaderHidden");}};s.prototype._createAppointmentsMap=function(A){var i=this;return A.reduce(function(j,w){var x=w.getStartDate(),y=w.getEndDate(),z,E,G;if(!x||!y){return j;}if(!i.isAllDayAppointment(x,y)){z=g.fromLocalJSDate(x);E=g.fromLocalJSDate(y);while(z.isSameOrBefore(E)){G=i._getDateFormatter().format(z.toLocalJSDate());if(!j.appointments[G]){j.appointments[G]=[];}j.appointments[G].push(w);z.setDate(z.getDate()+1);}}else{j.blockers.push(w);}return j;},{appointments:{},blockers:[]});};s.prototype._calculateVisibleAppointments=function(A,j,w){var V={},x,y,z;for(var i=0;i<w;i++){x=new g(j.getFullYear(),j.getMonth(),j.getDate()+i);y=this._getDateFormatter().format(x.toLocalJSDate());z=this._isAppointmentFitInVisibleHours(x);if(A[y]){V[y]=A[y].filter(z,this).sort(this._sortAppointmentsByStartHourCallBack);}}return V;};s.prototype._isAppointmentFitInVisibleHours=function(i){return function(A){var j=A.getStartDate().getTime(),w=A.getEndDate().getTime(),x=(new U(i.getYear(),i.getMonth(),i.getDate(),this._getVisibleStartHour())).getTime(),y=(new U(i.getYear(),i.getMonth(),i.getDate(),this._getVisibleEndHour(),59,59)).getTime();var z=j<x&&w>y,E=j>=x&&j<y,G=w>x&&w<=y;return z||E||G;};};s.prototype._calculateAppointmentsLevelsAndWidth=function(V){var i=this;return Object.keys(V).reduce(function(A,j){var w=0,x=new S.list(),y=V[j];y.forEach(function(z){var E=new S.node(z),G=z.getStartDate().getTime();if(x.getSize()===0){x.add(E);return;}x.getIterator().forEach(function(J){var N=true,Q=J.getData(),T=Q.getStartDate().getTime(),W=Q.getEndDate().getTime(),X=W-T;if(X<H){W=W+(H-X);}if(G>=T&&G<W){E.level++;w=Math.max(w,E.level);}if(J.next&&J.next.level===E.level){N=false;}if(G>=W&&N){this.interrupt();}});x.insertAfterLevel(E.level,E);});A[j]={oAppointmentsList:i._calculateAppointmentsWidth(x),iMaxLevel:w};return A;},{});};s.prototype._calculateAppointmentsWidth=function(A){A.getIterator().forEach(function(i){var j=i.getData(),w=i.level,x=i.level,y=j.getStartDate().getTime(),z=j.getEndDate().getTime(),E=z-y;if(E<H){z=z+(H-E);}new S.iterator(A).forEach(function(G){var J=G.getData(),N=G.level,Q=J.getStartDate().getTime(),T=J.getEndDate().getTime(),V=T-Q;if(V<H){T=T+(H-V);}if(x>=N){return;}if(y>=Q&&y<T||z>Q&&z<T||y<=Q&&z>=T){i.width=N-x;this.interrupt();return;}if(w<N){w=N;i.width++;}});});return A;};s.prototype._calculateVisibleBlockers=function(i,j,w){var x=new g(j.getYear(),j.getMonth(),j.getDate()+w-1),y=this._isBlockerVisible(j,x);return i.filter(y).sort(this._sortAppointmentsByStartHourCallBack);};s.prototype._isBlockerVisible=function(V,i){return function(A){var j=g.fromLocalJSDate(A.getStartDate()),w=g.fromLocalJSDate(A.getEndDate());var x=j.isBefore(V)&&w.isAfter(i),y=h._isBetween(j,V,i,true),E=h._isBetween(w,V,i,true);return x||y||E;};};s.prototype._calculateBlockersLevelsAndWidth=function(V){var i=0,j=new S.list();V.forEach(function(w){var x=new S.node(w),y=g.fromLocalJSDate(w.getStartDate()),z=g.fromLocalJSDate(w.getEndDate());x.width=h._daysBetween(z,y);if(j.getSize()===0){j.add(x);return;}j.getIterator().forEach(function(A){var E=true,G=A.getData(),J=g.fromLocalJSDate(G.getStartDate()),N=g.fromLocalJSDate(G.getEndDate());if(y.isSameOrAfter(J)&&y.isSameOrBefore(N)){x.level++;i=Math.max(i,x.level);}if(A.next&&A.next.level===x.level){E=false;}if(y.isSameOrAfter(N)&&E){this.interrupt();}});j.insertAfterLevel(x.level,x);},this);return{oBlockersList:j,iMaxlevel:i};};s.prototype._sortAppointmentsByStartHourCallBack=function(A,i){return A.getStartDate().getTime()-i.getStartDate().getTime()||i.getEndDate().getTime()-A.getEndDate().getTime();};s.prototype._getVisibleAppointments=function(){return this._oVisibleAppointments;};s.prototype._getAppointmentsToRender=function(){return this._oAppointmentsToRender;};s.prototype._getVisibleBlockers=function(){return this._aVisibleBlockers;};s.prototype._getBlockersToRender=function(){return this._oBlockersToRender;};s.prototype._setColumns=function(i){this._iOldColumns=this._iColumns;this._iColumns=i;this.getAggregation("_columnHeaders").setDays(i);this.invalidate();return this;};s.prototype._getColumns=function(){return this._iColumns;};s.prototype._getRowHeight=function(){return this._isCompact()?n:R;};s.prototype._getBlockerRowHeight=function(){return this._isCompact()?o:B;};s.prototype._isCompact=function(){var i=this.getDomRef();while(i&&i.classList){if(i.classList.contains("sapUiSizeCompact")){return true;}i=i.parentNode;}return false;};s.prototype._getCoreLocaleId=function(){if(!this._sLocale){this._sLocale=sap.ui.getCore().getConfiguration().getFormatSettings().getFormatLocale().toString();}return this._sLocale;};s.prototype._getCoreLocaleData=function(){var i,j;if(!this._oLocaleData){i=this._getCoreLocaleId();j=new a(i);this._oLocaleData=L.getInstance(j);}return this._oLocaleData;};s.prototype._hasAMPM=function(){var i=this._getCoreLocaleData();return i.getTimePattern("short").search("a")>=0;};s.prototype._getHoursFormat=function(){var i=this._getCoreLocaleId();if(!this._oHoursFormat||this._oHoursFormat.oLocale.toString()!==i){var j=new a(i),w=this._getHoursPattern();this._oHoursFormat=D.getTimeInstance({pattern:w},j);}return this._oHoursFormat;};s.prototype._getHoursPattern=function(){return this._hasAMPM()?"h":"H";};s.prototype._getAMPMFormat=function(){var i=this._getCoreLocaleId(),j=new a(i);if(!this._oAMPMFormat||this._oAMPMFormat.oLocale.toString()!==i){this._oAMPMFormat=D.getTimeInstance({pattern:"a"},j);}return this._oAMPMFormat;};s.prototype._getColumnHeaders=function(){return this.getAggregation("_columnHeaders");};s.prototype._getAppointmentAnnouncementInfo=function(A){var i=this._oUnifiedRB.getText("CALENDAR_START_TIME"),E=this._oUnifiedRB.getText("CALENDAR_END_TIME"),j=this._oFormatStartEndInfoAria.format(A.getStartDate()),w=this._oFormatStartEndInfoAria.format(A.getEndDate()),x=i+": "+j+"; "+E+": "+w;return x+"; "+P.findLegendItemForItem(sap.ui.getCore().byId(this._sLegendId),A);};s.prototype.enhanceAccessibilityState=function(i,A){if(i.getId()===this._getColumnHeaders().getId()){A.labelledby=I.getStaticId("sap.m","PLANNINGCALENDAR_DAYS");}};s.prototype._getCellStartEndInfo=function(i,E){var j=this._oUnifiedRB.getText("CALENDAR_START_TIME"),w=this._oUnifiedRB.getText("CALENDAR_END_TIME"),x=!E;if(x){return j+": "+this._oFormatAriaFullDayCell.format(i)+"; ";}return j+": "+this._oFormatStartEndInfoAria.format(i)+"; "+w+": "+this._oFormatStartEndInfoAria.format(E);};s.prototype.isAllDayAppointment=function(A,i){var j=A.getHours()===0,w=A.getMinutes()===0,x=A.getSeconds()===0,y=A.getMilliseconds()===0,z=j&&w&&x&&y,E=false;if(z){E=this._isEndTime0000(A,i);}return E;};s.prototype._isEndTime0000=function(A,i){return(i.getTime()-A.getTime())%M===0;};s.prototype._createBlockersDndPlaceholders=function(j,w){this.destroyAggregation("_blockersPlaceholders");for(var i=0;i<w;i++){var x=new U(j.getFullYear(),j.getMonth(),j.getDate()+i);var y=new v({date:x});this.addAggregation("_blockersPlaceholders",y,true);}};s.prototype._createAppointmentsDndPlaceholders=function(w,x){var y=this._getVisibleStartHour(),E=this._getVisibleEndHour();this._dndPlaceholdersMap={};this.destroyAggregation("_intervalPlaceholders");for(var i=0;i<x;i++){var z=new g(w.getFullYear(),w.getMonth(),w.getDate()+i);if(!this._dndPlaceholdersMap[z]){this._dndPlaceholdersMap[z]=[];}for(var j=y;j<=E;j++){var A=this._dndPlaceholdersMap[z],Y=z.getYear(),G=z.getMonth(),J=z.getDate();A.push(this._createAppointmentsDndPlaceHolder(new U(Y,G,J,j)));A.push(this._createAppointmentsDndPlaceHolder(new U(Y,G,J,j,30)));}}};s.prototype._createAppointmentsDndPlaceHolder=function(i){var j=new v({date:i});this.addAggregation("_intervalPlaceholders",j,true);return j;};function t(){var $=q("<span></span>").addClass("sapUiCalAppResizeGhost");$.appendTo(document.body);setTimeout(function(){$.remove();},0);return $.get(0);}var v=C.extend("sap.m.SinglePlanningCalendarGrid._internal.IntervalPlaceholder",{metadata:{properties:{date:{type:"object",group:"Data"}}},renderer:function(i,j){i.write("<div");i.writeControlData(j);i.addClass("sapMSinglePCPlaceholder");i.writeClasses();i.write("></div>");}});function _(){var i=this.getDomRef(),j=this.$().find(".sapMSinglePCBlockersColumn").toArray();this._aGridCells=Array.prototype.concat(j);for(var w=0;w<=this._getVisibleEndHour();++w){j=this.$().find("div[data-sap-hour='"+w+"']").toArray();this._aGridCells=this._aGridCells.concat(j);}if(!this._oItemNavigation){this._oItemNavigation=new m();this.addDelegate(this._oItemNavigation);}this._oItemNavigation.setRootDomRef(i);this._oItemNavigation.setItemDomRefs(this._aGridCells);this._oItemNavigation.setCycling(false);this._oItemNavigation.setDisabledModifiers({sapnext:["alt","meta"],sapprevious:["alt","meta"],saphome:["alt","meta"],sapend:["meta"]});this._oItemNavigation.setTableMode(true,true).setColumns(this._getColumns());this._oItemNavigation.setPageSize(this._aGridCells.length);}return s;});
