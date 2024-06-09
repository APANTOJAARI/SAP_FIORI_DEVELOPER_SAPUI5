ace.define("ace/ext/statusbar",["require","exports","module","ace/lib/dom","ace/lib/lang"],function(a,e,m){"use strict";var d=a("ace/lib/dom");var l=a("ace/lib/lang");var S=function(b,p){this.element=d.createElement("div");this.element.className="ace_status-indicator";this.element.style.cssText="display: inline-block;";p.appendChild(this.element);var s=l.delayedCall(function(){this.updateStatus(b);}.bind(this)).schedule.bind(null,100);b.on("changeStatus",s);b.on("changeSelection",s);b.on("keyboardActivity",s);};(function(){this.updateStatus=function(b){var s=[];function f(h,i){h&&s.push(h,i||"|");}f(b.keyBinding.getStatusText(b));if(b.commands.recording)f("REC");var g=b.selection;var c=g.lead;if(!g.isEmpty()){var r=b.getSelectionRange();f("("+(r.end.row-r.start.row)+":"+(r.end.column-r.start.column)+")"," ");}f(c.row+":"+c.column," ");if(g.rangeCount)f("["+g.rangeCount+"]"," ");s.pop();this.element.textContent=s.join("");};}).call(S.prototype);e.StatusBar=S;});(function(){ace.require(["ace/ext/statusbar"],function(m){if(typeof module=="object"&&typeof exports=="object"&&module){module.exports=m;}});})();
