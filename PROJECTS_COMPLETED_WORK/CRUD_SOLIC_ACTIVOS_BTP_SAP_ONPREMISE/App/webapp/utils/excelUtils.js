sap.ui.define(
  [
    "centria/net/fisbactivos/utils/dataManipulationUtils",
    "sap/ui/core/format/DateFormat"
  ],
  function (dataManipulationUtils, DateFormat) {
    "use strict";

    return {
      _createTable: function (id) {
        let table = document.createElement("table");
        table.id = id;
        table.style.cssText =
          "font-family: sans-serif; font-size: 0.9em; border: 1px solid rgb(174, 215, 255);";

        return table;
      },

      _createHeaderSection: function (odataSolBaj, i18nText) {

        let headerCells = null;
        let TZOffsetMs = new Date(0).getTimezoneOffset() * 60 * 1000;
        let headerTbody = document.createElement("tbody");
        headerTbody.style.border = "1px solid black";

        try {

          let headerTr = headerTbody.insertRow();

          headerCells = null;
          headerCells = headerTr.insertCell();

          headerCells.innerHTML = `<b>${i18nText.getText("excField17")}</b>`;
          headerTr.style.color = "000308";
          headerTr.style.textAlign = "left";
          headerTr.style.fontWeight = "bold";
          headerTr.style.height = "40px";
          headerTr.style.textDecoration = "underline";
          headerTr.style.fontStyle = "italic"
          headerCells.colSpan = 2;
          headerCells = null;

          headerTr = headerTbody.insertRow();
          headerCells = null;
          headerCells = headerTr.insertCell();
          headerCells.innerHTML = '</br>';
          headerCells.colSpan = 2;
          headerCells = null;

          headerTr = headerTbody.insertRow();
          headerCells = null;
          headerCells = headerTr.insertCell();
          headerCells.innerHTML = '</br>';
          headerCells.colSpan = 2;
          headerCells = null;

          headerTr = headerTbody.insertRow();
          let headerCell0 = headerTr.insertCell();
          headerCell0.innerHTML = `<b>${i18nText.getText("excField1")} </b>${odataSolBaj.SolicBaja.IdSolic}`;
          headerCell0.colSpan = 2;
          headerCells = null;

          let fechaSolicFormat = DateFormat.getDateInstance({ pattern: "dd/MM/YYYY" });
          let fechaSolicStr = fechaSolicFormat.format(new Date(odataSolBaj.SolicBaja.FecSolic.getTime() + TZOffsetMs))

          headerTr = headerTbody.insertRow();
          headerCells = headerTr.insertCell();
          headerCells.innerHTML = `<b>${i18nText.getText("excField6")} </b>${fechaSolicStr}`;
          headerCells.colSpan = 2;
          headerCells = null;

          headerTr = headerTbody.insertRow();
          headerCells = headerTr.insertCell();
          headerCells.innerHTML = `<b>${i18nText.getText("excField5")} </b>${odataSolBaj.SolicBaja.StaSolic}`;
          headerCells.colSpan = 2;

          headerTr = headerTbody.insertRow();
          headerCells = headerTr.insertCell();
          headerCells.innerHTML = `<b>${i18nText.getText("excField2")} </b>${odataSolBaj.SolicBaja.UsuSolic}`;
          headerCells.colSpan = 2;
          headerCells = null;

          headerTr = headerTbody.insertRow();
          headerCells = headerTr.insertCell();
          headerCells.innerHTML = `<b>${i18nText.getText("excField3")} </b>${odataSolBaj.SolicBaja.RespBaja2}`;
          headerCells.colSpan = 2;
          headerCells = null;

          let timeCreac = DateFormat.getTimeInstance({ pattern: "HH:mm:ss" });
          let timeStr = timeCreac.format(new Date(odataSolBaj.SolicBaja.HorCre.ms + TZOffsetMs));  //11:00 PM
          let fechaCreac = fechaSolicFormat.format(new Date(odataSolBaj.SolicBaja.FecCre.getTime() + TZOffsetMs))

          headerTr = headerTbody.insertRow();
          headerCells = headerTr.insertCell();
          headerCells.innerHTML = `<b>${i18nText.getText("excField4")} </b>${fechaCreac} ${timeStr}`;
          headerCells.colSpan = 2;
          headerCells = null;

          headerTr = headerTbody.insertRow();
          headerCells = headerTr.insertCell();
          headerCells.innerHTML = '</br>';

        } catch (error) {
          console.log(error);
        }

        return headerTbody;
      },

      _addColumnHeaders: function (table, columnHeaders) {
        let tr = document.createElement("tr");
        tr.style.color = "#fff";
        tr.style.textAlign = "left";
        tr.style.fontWeight = "bold";

        // Add the column headers
        columnHeaders.forEach((header) => {
          let th = document.createElement("th");
          th.innerHTML = header;
          th.style.backgroundColor = "rgb(40, 110, 180)";
          th.style.padding = "12px 15px";
          th.style.height = "40px";
          th.style.border = "1px solid rgb(174, 215, 255)";
          tr.appendChild(th);
        });

        table.appendChild(tr);

        return tr;
      },

      _setCellStyle: function (cell) {
        cell.style.padding = "12px 15px";
        cell.style.border = "1px solid rgb(174, 215, 255)";

        cell.style.textAlign = "center";
        cell.style.verticalAlign = "middle";
      },

      _insertRowValues: function (fieldNames, cells, index, item) {
        fieldNames.forEach((fieldName) => {

          switch (fieldName) {
            case "NumIvent": {
              let cellValue = `${item.NumIvent}<br>`;
              cells[0].innerHTML = cellValue;
              break;
            }
            case "CodActfijo": {
              let cellValue = `${item.CodActfijo}<br>`;
              cells[1].innerHTML = cellValue;
              break;
            }
            case "DesInvent": {
              let cellValue = `${item.DesInvent}<br>`;
              cells[2].innerHTML = cellValue;
              break;
            }
            case "MarcaAct": {
              let cellValue = `${item.MarcaAct}<br>`;
              cells[3].innerHTML = cellValue;
              break;
            }
            case "ModeloAct": {
              let cellValue = `${item.ModeloAct}<br>`;
              cells[4].innerHTML = cellValue;
              break;
            }
            case "SerInvent": {
              let cellValue = `${item.SerInvent}<br>`;
              cells[5].innerHTML = cellValue;
              break;
            }
            case "CecoAct": {
              let cellValue = `${item.CecoAct}<br>`;
              cells[6].innerHTML = cellValue;
              break;
            }
            case "ValorNeto": {
              let cellValue = `${item.ValorNeto}<br>`;
              cells[7].innerHTML = cellValue;
              break;
            }
            case "Motivbaja": {
              let cellValue = `${item.Motivbaja}<br>`;
              cells[8].innerHTML = cellValue;
              break;
            }
            case "TipoBaja": {
              let cellValue = `${item.TipoBaja}<br>`;
              cells[9].innerHTML = cellValue;
              break;
            }
            default:
              break;
          }
        });
      },

      _getExpandedData: async function (controller) {
        let expand = "Supplier,Category";
        let data = await odataUtils.readExpandFromBackend(
          "Products",
          expand,
          controller._mainModel
        );

        if (data && data.results && data.results.length > 1) {
          data.results.forEach(result => {
            result.CategoryName = result.Category.CategoryName ? result.Category.CategoryName : result.CategoryID;
            result.CompanyName = result.Supplier.CompanyName ? result.Supplier.CompanyName : result.SupplierID;
          });
        }

        if (data.results) return data.results;

        return null;
      },

      _insertCategory: function (key, table) {
        let groupTbody = document.createElement("tbody");
        let groupTr = groupTbody.insertRow();
        groupTr.style.textAlign = "left";
        let groupCell = groupTr.insertCell();
        groupCell.colSpan = 6;
        groupCell.style.backgroundColor = "rgb(201, 238, 242)";
        groupCell.style.height = "30px";
        groupCell.style.verticalAlign = "middle";

        groupCell.innerHTML =
          `<b>Category: </b>${key}`;
        table.appendChild(groupTbody);
      },

      createDOMTable: async function (controller, oModelMain, odataSolBaj, i18nText) {
        let table = this._createTable("domTable");

        try {


          // Add the header section on top...
          let headerSection = this._createHeaderSection(odataSolBaj, i18nText);
          table.appendChild(headerSection);

          let columnHeaders = [
            i18nText.getText("excField7"),
            i18nText.getText("excField8"),
            i18nText.getText("excField9"),
            i18nText.getText("excField10"),
            i18nText.getText("excField11"),
            i18nText.getText("excField12"),
            i18nText.getText("excField13"),
            i18nText.getText("excField14"),
            i18nText.getText("excField15"),
            i18nText.getText("excField16"),];

          let tr = this._addColumnHeaders(table, columnHeaders);

          //------------------ -----------New Lógica-----------------------------

          // Add JSON data as rows to the table
          let tbody = document.createElement("tbody");
          let fieldNames = Object.keys(odataSolBaj.SolicBaja.DetailSolBajaSet[0]);

          odataSolBaj.SolicBaja.DetailSolBajaSet.forEach((item, index) => {
            tr = tbody.insertRow();
            let cells = [];
            //Value Column
            columnHeaders.forEach((columnHeader, i) => {
              cells[i] = tr.insertCell();
              this._setCellStyle(cells[i]);
            });
            this._insertRowValues(fieldNames, cells, index, item);
            table.appendChild(tbody);

          })

          return table;
        } catch (error) {
        }
      },

      writeToExcel: function (table, filename) {
        /*
        //let dataType = "application/vnd.ms-excel" + ';charset=utf-8';
        let dataType = "application/vnd.ms-excel; charset=UTF-8";
        let tableHTML = table.outerHTML.replace(/ /g, "%20");

        // Create download link element
        let downloadLink = document.createElement("a");
        downloadLink.id = "domHyperlink";
        try {
          document.body.appendChild(downloadLink);

          if (navigator.msSaveOrOpenBlob) {
            let blob = new Blob(["\ufeff", tableHTML], {
              type: dataType,
            });
            navigator.msSaveOrOpenBlob(blob, filename);
          } else {
            // Create a link to the file
            downloadLink.href = "data:" + dataType + ", " + tableHTML;

            // Setting the file name
            downloadLink.download = filename;

            //triggering the function
            downloadLink.click();
*/
        this.Exportar(table, filename);
        /*
       } catch (error) {
       }*/
      },
      FormatterTime: function (value) {
        return value.match(/(\d{2})H(\d{2})M(\d{2})S$/).slice(-3).join(":");
      },
      Exportar: function (table, filename) {
        try {


          let uri = `data:application/vnd.ms-excel;filename=${filename}.xls;base64,`;
          let template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body><table>{table}</table></body></html>'
          let base64 = function (s) { return window.btoa(unescape(encodeURIComponent(s))) }
          let format = function (s, c) { return s.replace(/{(\w+)}/g, function (m, p) { return c[p]; }) }

          //var table = 'tblReporte';
          //var name = 'nombre_hoja_calculo';

          if (!table.nodeType) table = document.getElementById(table)
          let ctx = { worksheet: filename || 'Worksheet', table: table.innerHTML }

          //window.location.href = uri + base64(format(template, ctx))
          const link = document.createElement("a");
          link.href = uri + base64(format(template, ctx))
          link.download = `${filename}.xls`;
          link.click();
        } catch (error) {
        }
      }

    };
  }
);