/*!
 * OpenUI5
 * (c) Copyright 2009-2020 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(['sap/ui/base/Object',"sap/base/Log","sap/ui/util/ActivityDetection","sap/ui/core/IntervalTrigger","sap/ui/thirdparty/jquery"],function(B,L,A,I,q){"use strict";var l=L.getLogger("sap.ui.core.ResizeHandler",L.Level.ERROR);var c=null;var R=B.extend("sap.ui.core.ResizeHandler",{constructor:function(C){B.apply(this);c=C;this.aResizeListeners=[];this.aSuspendedDomRefs=[];this.bRegistered=false;this.iIdCounter=0;this.fDestroyHandler=this.destroy.bind(this);q(window).on("unload",this.fDestroyHandler);A.attachActivate(b,this);}});function a(){if(this.bRegistered){this.bRegistered=false;I.removeListener(this.checkSizes,this);}}function b(){if(!this.bRegistered&&this.aResizeListeners.length>0){this.bRegistered=true;I.addListener(this.checkSizes,this);}}R.prototype.destroy=function(e){A.detachActivate(b,this);q(window).off("unload",this.fDestroyHandler);c=null;this.aResizeListeners=[];this.aSuspendedDomRefs=[];a.call(this);};R.prototype.attachListener=function(r,h){var i=B.isA(r,'sap.ui.core.Control'),d=r instanceof q,D=i?r.getDomRef():r,w=D?D.offsetWidth:0,H=D?D.offsetHeight:0,s="rs-"+Date.now()+"-"+this.iIdCounter++,e;if(i){e=("Control "+r.getId());}else if(r.id){e=r.id;}else{e=String(r);}this.aResizeListeners.push({sId:s,oDomRef:i?null:r,oControl:i?r:null,bIsJQuery:d,fHandler:h,iWidth:w,iHeight:H,dbg:e});l.debug("registered "+e);b.call(this);return s;};R.prototype.detachListener=function(s){var r=this.aResizeListeners;for(var i=0;i<r.length;i++){if(r[i].sId===s){r.splice(i,1);l.debug("deregistered "+s);break;}}if(r.length===0){a.call(this);}};R.prototype.checkSizes=function(){var d=l.isLoggable();if(d){l.debug("checkSizes:");}this.aResizeListeners.forEach(function(r){if(r){var C=!!r.oControl,D=C?r.oControl.getDomRef():r.oDomRef;D=r.bIsJQuery?D[0]:D;if(D&&document.documentElement.contains(D)&&!this._isSuspended(D)){var o=r.iWidth,O=r.iHeight,n=D.offsetWidth,N=D.offsetHeight;if(o!=n||O!=N){r.iWidth=n;r.iHeight=N;var e=q.Event("resize");e.target=D;e.currentTarget=D;e.size={width:n,height:N};e.oldSize={width:o,height:O};e.control=C?r.oControl:null;if(d){l.debug("resize detected for '"+r.dbg+"': "+e.oldSize.width+"x"+e.oldSize.height+" -> "+e.size.width+"x"+e.size.height);}r.fHandler(e);}}}},this);if(R._keepActive!=true&&R._keepActive!=false){R._keepActive=false;}if(!A.isActive()&&!R._keepActive){a.call(this);}};R.register=function(r,h){if(!c||!c.oResizeHandler){return null;}return c.oResizeHandler.attachListener(r,h);};R.deregister=function(i){if(!c||!c.oResizeHandler){return;}c.oResizeHandler.detachListener(i);};R.deregisterAllForControl=function(C){if(!c||!c.oResizeHandler){return;}c.oResizeHandler.aResizeListeners.filter(function(r){return r&&r.oControl&&r.oControl.getId()===C;}).forEach(function(r){R.deregister(r.sId);});};R.suspend=function(d){if(!c||!c.oResizeHandler){return false;}if(!document.documentElement.contains(d)){return false;}var r=c.oResizeHandler;if(r.aSuspendedDomRefs.indexOf(d)===-1){r.aSuspendedDomRefs.push(d);}return true;};R.resume=function(d){if(!c||!c.oResizeHandler){return false;}var r=c.oResizeHandler,i=r.aSuspendedDomRefs.indexOf(d);if(i===-1){return false;}r.aSuspendedDomRefs.splice(i,1);r.checkSizes();return true;};R.prototype._isSuspended=function(d){var s=this.aSuspendedDomRefs,n;for(var i=0;i<s.length;i++){n=s[i];if(n.contains(d)){return true;}}return false;};return R;});
