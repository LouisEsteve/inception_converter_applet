import { Component, OnInit, ViewChild } from '@angular/core';
import { DxDataGridComponent, DxTabPanelComponent } from 'devextreme-angular';
import {SAXParser} from 'sax';
import { AppInfoService, Tag } from 'src/app/shared/services';
import { saveAs } from 'file-saver';

// import 'ngx-highlightjs';

import hljs from 'highlight.js/lib/core';
import xml from 'highlight.js/lib/languages/xml';
hljs.registerLanguage('xml',xml);

import * as JSZip from 'jszip';

@Component({
  selector: 'app-sax2',
  templateUrl: './sax2.component.html',
  styleUrls: ['./sax2.component.scss']
})
export class Sax2Component implements OnInit {

  @ViewChild('xmlGrid', { static: true }) xmlGrid: DxDataGridComponent;
  @ViewChild('tabPanel', { static: true }) tabPanel: DxTabPanelComponent;

  dataSource: any;
  priority: any[];
  depth: number = 0;
  fichierXML: any = undefined;

  docDataSource = [];
  docColumns = [];
  docContentMap = {};
  docTagMap = {};
  lastSelectedTag: string = undefined;
  lastSelectedAttrs: any = [];
  lastSelectedTagType: number = 0;

  parser: SAXParser;


  selectedRange: any = {};
  isSelectionStopped: any;

  /* <LOUIS> */
  tagsAverageContentLength: any = [];
  tagsChainingRatio: any = [];
  full_xml = '';
  highlighted_full_xml = '';
  first_document = 'First document';
  suggestionTickVisible = false;
  firstDocumentVisible = false;
  number_of_documents = 0;
  auto_authentication = false;
  remember_authentication = (window.localStorage.getItem('remember_authentication') === 'true')? true : false;
  project_name = '';
  inception_id = '';
  inception_password = '';
  inception_url = '';
  uploadedXML = '';
  /* </LOUIS> */
  tagdefDataSource: any = [];
  tagColors: any = ["#cc99ff", "#80e5ff", "#ff9966", "#ffff1a", "#cc99ff", "#80e5ff", "#ff9966", "#ffff1a", "#cc99ff", "#80e5ff", "#ff9966", "#ffff1a", "#cc99ff", "#80e5ff", "#ff9966", "#ffff1a", "#cc99ff", "#80e5ff", "#ff9966", "#ffff1a"];


  taginfoPopup: any = {};

  popupSelectVisible: boolean = false;
  popupTagsVisible: boolean = true;

  /* <LOUIS> */
  suggestionPopupTagsVisible: boolean = false;
  suggestionDataSource: any = [
    {
      id:0,
      quality: "Nécessaire",
      scale: "Document",
      suggestions: [],
      suggestions_str: '',
      choice: ''
    },
    {
      id:1,
      quality: "Facultatif",
      scale: "Paragraphe",
      suggestions: [],
      suggestions_str: '',
      choice: ''
    },
    {
      id:2,
      quality: "Facultatif",
      scale: "Phrase",
      suggestions: [],
      suggestions_str: '',
      choice: ''
    }
  ];
  /* </LOUIS> */

  addTagButtonComponent: any = undefined;

  pythonCode: string = "";

  tagTypes: any = [
    { value: 0, label: "doc", class: "document", color: "#ff9999" },
    { value: 1, label: "paragraph", class: "paragraph", color: "#99b3ff" },
    { value: 2, label: "phrase", class: "sentence", color: "#85e085" },
    { value: 3, label: "annotation", class: "webanno.custom.", color: undefined },
    { value: 4, label: "IGNORER", class: undefined, color: "gray" },
    { value: 4, label: "Extérieur", class: undefined, color: "gray" },
  ];

  constraintTypes: any = [
    { label: "none", value: "document" },
    { label: "relative level==1", value: "1" },
  ];

  typesystemTemplate: string = undefined;
  typesystem: string = "<xml></xml>";


  editorOptions = { theme: 'vs-dark', language: 'text/plain' };


  constructor(public appInfo: AppInfoService) {

    // this.typesystemTemplate  =  appInfo.getTypesystemTemplate();
    appInfo.getTypesystemTemplate().then(r => {
      this.typesystemTemplate = r;
    });

  }



  customizeColumns(columns) {
    // columns[0].width = 70;
  }



  onFileUploaderValueChanged(event) {
    // console.log("onFileUploaderValueChanged, event=", event); 
    if (event.value && event.value[0]) {

      let file = event.value[0];

      if (!file) {
        alert("Fichier requis");
        event.cancel = true;
        return;
      }
      this.fichierXML = file.name;
      this.uploadedXML = file;
      /*
      let filename = file.name.split('.');
      if (filename.length != 2) {
        console.error("Nom de fichier invalide.");
        alert("Nom de fichier invalide");
        return;
      }
      let name = filename[0];
      let ext = filename[1];
      */
      /* <LOUIS> */
      if(!(file.name.endsWith('.xml'))){
        console.error("Nom de fichier invalide.");
        alert("Nom de fichier invalide");
        return;
      }
      /* </LOUIS> */
      let reader = new FileReader();
      this.depth = 0;
      reader.onload = () => {
        this.initParser();
        this.parser.write(reader.result).close();
        
        /* <LOUIS> */
        this.collectTags();
        // document.getElementById('xml_display_iframe').src = file.name;
        // var tab_panel = document.getElementById('main_tab_panel');
        // var dxi_item = document.createElement('dxi-item');
        // dxi_item.title = 'Fichier XML';
        /*
        var div = document.createElement('div');
        var iframe = document.createElement('iframe');
        iframe.src = file.name;
        // iframe.style = 'width:100%;height:600px;border:0px';
        div.appendChild(iframe);
        dxi_item.appendChild(div);
        */
        // tab_panel.appendChild(dxi_item);
        /*
        var dxi_item = document.getElementById('dxi_item_iframe');
        var div = document.createElement('div');
        var iframe = document.createElement('iframe');
        iframe.src = file.name;
        // iframe.style = 'width:100%;height:600px;border:0px';
        div.appendChild(iframe);
        dxi_item.appendChild(div);
        */

        // this.highlighted_full_xml = hljs.highlight(this.full_xml,{language:'xml'}).value;
        // document.getElementById('xml_p').innerHTML = this.highlighted_full_xml; // ICI



        this.suggestionTickVisible = true;
        this.suggestionPopupTagsVisible = true;
        for(var i = 0, i_limit = this.tagdefDataSource.length ; i < i_limit ; i++){
          if(this.tagdefDataSource[i]['type'] === 0){
            this.suggestionDataSource[0].choice = this.tagdefDataSource[i]['tag'];
            break;
          }
        } 
        this.updateSystem();
        /* </LOUIS> */
      }

      reader.readAsText(file);
      // var txt = reader.readAsText(file);
      // console.log(txt);

      /* <LOUIS> */
      // this.collectTags();
      // console.log(this.tagdefDataSource);
      // var interval = setTimeout(this.collectTags,500);
      // console.log('interval set');
      /* </LOUIS> */
    }
  }

  ngOnInit() {

  }


  initParser() {
    let zis = this;
    var contenu = "";
    this.docColumns = ["id"];

    var rowid = 0;
    zis.docDataSource = [];

    this.parser = new SAXParser(true);

    /* <LOUIS> */
    // var tagsAverageContentLength = [];
    var charIndex = 0;
    var endedElement = '';
    zis.full_xml = '';
    /* </LOUIS> */

    this.parser.onerror = function (e) {
      console.log("<ERROR>" + rowid + " " + JSON.stringify(e) + "</ERROR>");
        alert("<ERROR>" + rowid + " " + JSON.stringify(e) + "</ERROR>");
    };
    this.parser.ontext = function (t) {
      // got some text.  t is the string of text.
      contenu = t;
      /* <LOUIS> */
      // charIndex += chars.length;
      charIndex += t.length;
      zis.full_xml += t;
      /* </LOUIS> */
    };
    this.parser.onopentag = function (node) {
      // opened a tag.  node has "name" and "attributes"
      //  console.log("=> Started: " , node ); // +      "  (Attributes: "+   zis.attrToString(node.attributes)+" )" );

       /* <LOUIS> */
        // if(!(elem in tagsAverageContentLength)){
          // if(!(elem in zis.tagsAverageContentLength)){
          if(!(node.name in zis.tagsAverageContentLength)){
            // tagsAverageContentLength[elem] = {
              // zis.tagsAverageContentLength[elem] = {
              zis.tagsAverageContentLength[node.name] = {
              sum: 0,
              count: 0,
              average: undefined
            };
          }
          // tagsAverageContentLength[elem].sum -= charIndex;
          // zis.tagsAverageContentLength[elem].sum -= charIndex;
          zis.tagsAverageContentLength[node.name].sum -= charIndex;
          // console.log('NEG', charIndex);
  
  
  
  
          if(!(endedElement in zis.tagsChainingRatio)){
            zis.tagsChainingRatio[endedElement] = {
              count: 0,
              total_count: 0,
              // radio: undefined
              ratio: 0
            };
          }
          // if(elem === endedElement){
          if(node.name === endedElement){
            zis.tagsChainingRatio[endedElement].count++;
          }
          zis.tagsChainingRatio[endedElement].total_count++;
          // zis.tagsChainingRatio[endedElement].ratio = zis.tagsChainingRatio[endedElement].count / zis.tagsChainingRatio[endedElement].total_count;
          zis.tagsChainingRatio[endedElement].ratio = ~~((zis.tagsChainingRatio[endedElement].count / zis.tagsChainingRatio[endedElement].total_count)*1000)/1000;
          // zis.tagsChainingRatio[endedElement].ratio = (~~((zis.tagsChainingRatio[endedElement].count / zis.tagsChainingRatio[endedElement].total_count)*1000)/10).toString() + '%';
          /* </LOUIS> */

      rowid++;
      //console.log(rowid + " <elem>=" + elem);
      var row: any = {}
      var cname = "P" + zis.depth;
      row.attrsstr = zis.attrToString(node.attributes);
      if (node.attributes.length == 0)
        row[cname] = "<" + node.name + ">";
      else
        row[cname] = "<" + node.name + " " + row.attrsstr + ">";
      row.id = rowid;
      row.elem = node.name;
      row.attrs = node.attributes;
      for (var i = 1; i < zis.depth; i++) {
        row["P" + i] = "";
      }
      zis.docDataSource.push(row);

      if (zis.docColumns.indexOf(cname) == -1) {
        zis.docColumns.push(cname);
      }

      zis.depth = zis.depth + 1;


      /* <LOUIS> */
      zis.full_xml += '<' + node.name + '>';
      /* </LOUIS> */
    };
    this.parser.onattribute = function (attr) {
      // an attribute.  attr has "name" and "value"
    };
    this.parser.onclosetag = function (name) {
      // parser stream is done, and ready to have more stuff written to it.

          //  console.log("<= End: " , name );

           /* <LOUIS> */
        // tagsAverageContentLength[elem].sum += charIndex;
        // tagsAverageContentLength[elem].count++;
        // tagsAverageContentLength[elem].average = ~~(tagsAverageContentLength[elem].sum / tagsAverageContentLength[elem].count);
        
        // this.tagsAverageContentLength[elem].sum += charIndex;
        // this.tagsAverageContentLength[elem].count++;
        // this.tagsAverageContentLength[elem].average = ~~(this.tagsAverageContentLength[elem].sum / this.tagsAverageContentLength[elem].count);

        // zis.tagsAverageContentLength[elem].sum += charIndex;
        zis.tagsAverageContentLength[name].sum += charIndex;
        // console.log('POS', charIndex);
        // zis.tagsAverageContentLength[elem].count++;
        zis.tagsAverageContentLength[name].count++;
        // zis.tagsAverageContentLength[elem].average = ~~(zis.tagsAverageContentLength[elem].sum / zis.tagsAverageContentLength[elem].count);
        zis.tagsAverageContentLength[name].average = ~~(zis.tagsAverageContentLength[name].sum / zis.tagsAverageContentLength[name].count);

        // endedElement = elem;
        endedElement = name;
        /* </LOUIS> */

          rowid++;
          zis.depth = zis.depth - 1;
  
          var row: any = {}
          row["P" + zis.depth] = "</" + name + ">";
          row.id = rowid;
          row.elem = name;
          for (var i = 1; i < zis.depth; i++) {
            row["P" + i] = "";
          }
          zis.docDataSource.push(row);
          var previous = rowid > 1 ? zis.docDataSource[rowid - 2] : "";
  
          zis.docContentMap[rowid] = contenu;
          var previoustag = previous["P" + zis.depth];
          if (previous && previoustag && previoustag.substring(0, name.length + 1) == "<" + name) {
            zis.docContentMap[rowid - 1] = contenu;
          }
      
          /* <LOUIS> */
          zis.full_xml += '</' + name + '>';
          /* </LOUIS> */
    };

    // console.log(contenu);
    // console.log(this.full_xml);
  }



  onContentReady(e) {
 
  }


  onCellClick(e) {
    // Afficher les contenu de la cellule dans la popup
    //    console.log(e);
    if (e.data[e.column.dataField] && e.data[e.column.dataField][0] == "<")
      this.taginfoPopup.tag = "Tag : " + e.data[e.column.dataField];
    else
      this.taginfoPopup.tag = "";

    this.taginfoPopup.contenu = this.docContentMap[e.data.id];


  }

  onCellHoverChanged(e) {

  }

  onCellPrepared(e) {
    if (e.rowType === "data" /*&& e.column.dataField === "field"*/) {
      if (e.data.elem in this.docTagMap) {
        let data = this.docTagMap[e.data.elem];
        e.cellElement.style.background = data;
      }
    }
  }

  onToolbarPreparingSuggestionPopup(e) {
    var toolbarItems = e.toolbarOptions.items;

    /*
    toolbarItems.push({
      location: 'before',
      widget: 'dxButton',
      locateInMenu: 'auto',
      options: {
        type: 'normal',
        hint: 'Mettre à jour le type des balises',
        text: 'Mettre à jour toutes les balises',
        disabled: false,
        onInitialized: (e) => {
          // this.popupTagsVisible = false;
        },
        onClick: () => {
          // if(!this.tagdefDataSource || this.tagdefDataSource.length<1)
          // alert("Il faut d'abord chager un fichier");
          // else
          // this.collectTags();
          console.log("Bouton 'mise à jour'");
          // var button = document.getElementById('suggestionBox');
          // console.log(button);
          // button.style.display = 'block';
          // this.popupTagsVisible = true;
          // this.suggestionPopupTagsVisible = true;

          for(var i = 0, i_limit = this.tagdefDataSource.length ; i < i_limit ; i++){
            // if(this.tagdefDataSource[i].tag !== this.suggestionDataSource[0].choice && this.tagdefDataSource[i].type === 0){
            //   this.tagdefDataSource[i].type = 3;
            // }else if(this.tagdefDataSource[i].tag !== this.suggestionDataSource[1].choice && this.tagdefDataSource[i].type === 1){
            //   this.tagdefDataSource[i].type = 3;
            // }else if(this.tagdefDataSource[i].tag !== this.suggestionDataSource[2].choice && this.tagdefDataSource[i].type === 2){
            //   this.tagdefDataSource[i].type = 3;
            // }

            // if(this.tagdefDataSource[i].tag === this.suggestionDataSource[0].choice){
            //   if(this.tagdefDataSource[i].type === 0)
            //   this.tagdefDataSource[i].type = 3;
            // }

            if(this.tagdefDataSource[i].tag === this.suggestionDataSource[0].choice){
              this.tagdefDataSource[i].type = 0; 
            }else if(this.tagdefDataSource[i].tag === this.suggestionDataSource[1].choice){
              this.tagdefDataSource[i].type = 1; 
            }else if(this.tagdefDataSource[i].tag === this.suggestionDataSource[2].choice){
              this.tagdefDataSource[i].type = 2; 
            }else{
              this.tagdefDataSource[i].type = 3;
            }
          }
        }
      }
    }
    );
    */
  }

  generer(){
    this.typesystemGeneration();
    this.generatePythonParser();

    this.downloadZip();

    /*
    this.tabPanel.selectedIndex=1;
    this.popupTagsVisible = false;
    this.popupSelectVisible = false;
    this.suggestionPopupTagsVisible = false;
    */

    /* <LOUIS> */
    if(this.remember_authentication){
      window.localStorage.setItem('id',this.inception_id);
      window.localStorage.setItem('password',this.inception_password);
      window.localStorage.setItem('inception_url',this.inception_url);
    }else{
      window.localStorage.removeItem('id');
      window.localStorage.removeItem('password');
      window.localStorage.removeItem('inception_url');
    }
    window.localStorage.setItem('remember_authentication',this.remember_authentication.toString());
    /* </LOUIS> */
  }

  toggle_input_display(){
    /*
    var new_display = 'none';
    if(this.auto_authentication){
      new_display = 'block';
    }
    document.getElementById('project_name_input').style.display = new_display;
    document.getElementById('inception_id_input').style.display = new_display;
    document.getElementById('inception_password_input').style.display = new_display;
    console.log('toggle');
    */
    if(this.auto_authentication){
      document.getElementById('project_name_input').style.display = 'inline';



      var id_input = document.getElementById('inception_id_input');
      
      if(this.inception_id === ''){
        var stored_id = window.localStorage.getItem('id');
        if(stored_id !== null){
          // id_input.value = stored_id;
          this.inception_id = stored_id;
        }
      }
      
      id_input.style.display = 'inline';



      var password_input = document.getElementById('inception_password_input');
      
      if(this.inception_password === ''){
        var stored_password = window.localStorage.getItem('password');
        if(stored_password !== null){
          // password_input.value = stored_password;
          this.inception_password = stored_password;
        }
      }
      
      password_input.style.display = 'inline';





      var inception_input = document.getElementById('inception_url_input');
      
      if(this.inception_url === ''){
        var stored_url = window.localStorage.getItem('inception_url');
        if(stored_url !== null){
          // password_input.value = stored_password;
          this.inception_url = stored_url;
        }
      }
      
      inception_input.style.display = 'inline';
    }else{
      document.getElementById('project_name_input').style.display = 'none';
      document.getElementById('inception_id_input').style.display = 'none';
      document.getElementById('inception_password_input').style.display = 'none';
      document.getElementById('inception_url_input').style.display = 'none';
    }
  }

  onToolbarPreparing(e) {
    var toolbarItems = e.toolbarOptions.items;


    /*
    toolbarItems.push({
      location: 'before',
      widget: 'dxSelectBox',
      locateInMenu: 'auto',
      options: {
        hint: "Type d'annotation",
        items: this.tagTypes,
        value: this.tagTypes[0].value,
        displayExpr: "label",
        valueExpr: "value",
        disabled: false,
        onValueChanged: (args) => {
          this.lastSelectedTagType = args.value;
        }
      }
    }
    );
    */

    /*
    toolbarItems.push({
      location: 'before',
      widget: 'dxButton',
      locateInMenu: 'auto',
      options: {
        type: 'normal',
        hint: 'Ajouter un tag XML',
        text: 'Ajouter',
        disabled: true,
        onInitialized: (e) => {
          this.addTagButtonComponent =   e.component; // enabled only on xml table row selection
        },
        onClick: () => {
          if (this.lastSelectedTag) {

            var colour = this.tagTypes[this.lastSelectedTagType].color;
            if (this.lastSelectedTagType == 3) // custom annotation
            {
              var cnt = 0;
              this.tagdefDataSource.map(e => {
                if (e.type == 3) cnt++;
              });
              colour = this.tagColors[cnt];
            }

            var ne = {
              id: this.tagdefDataSource.length,
              attrs:   this.recupAttrNames(this.lastSelectedAttrs[0]),  
              attrsstr: this.lastSelectedAttrs[1],
              tag: this.lastSelectedTag,
              constraint: [],
              type: this.tagTypes[this.lastSelectedTagType].value,
              color: colour,
            };
            this.tagdefDataSource.push(ne);

            this.docTagMap[this.lastSelectedTag] = colour;
            if (this.xmlGrid.instance) this.xmlGrid.instance.refresh();
          }
        }
      }
    }
    );
    */


    /*
    toolbarItems.push({
      location: 'before',
      widget: 'dxButton',
      locateInMenu: 'auto',
      options: {
        type: 'normal',
        hint: 'Générer',
        text: 'Générer',
        disabled: false,
        onInitialized: (e) => {

        },
        onClick: () => {
          this.typesystemGeneration();
          this.generatePythonParser();

          this.tabPanel.selectedIndex=1;
          this.popupTagsVisible = false;
          this.popupSelectVisible = false;
        }
      }
    }
    );
    */




    /*
    toolbarItems.push({
      location: 'before',
      widget: 'dxButton',
      locateInMenu: 'auto',
      options: {
        type: 'normal',
        hint: 'Collecte toutes les balises',
        text: 'Collecter',
        disabled: false,
        onInitialized: (e) => {

        },
        onClick: () => {
          // if(!this.tagdefDataSource || this.tagdefDataSource.length<1)
          // alert("Il faut d'abord chager un fichier");
          // else
          this.collectTags();
          
        }
      }
    }
    );
    */
    

    /* <LOUIS> */
    /*
    toolbarItems.push({
      location: 'before',
      widget: 'dxButton',
      locateInMenu: 'auto',
      options: {
        type: 'normal',
        hint: 'Suggère certaines balises',
        text: 'Suggérer',
        disabled: false,
        onInitialized: (e) => {
          // this.popupTagsVisible = false;
        },
        onClick: () => {
          // if(!this.tagdefDataSource || this.tagdefDataSource.length<1)
          // alert("Il faut d'abord chager un fichier");
          // else
          // this.collectTags();
          console.log("Bouton 'suggérer'");
          // var button = document.getElementById('suggestionBox');
          // console.log(button);
          // button.style.display = 'block';
          // this.popupTagsVisible = true;
          this.suggestionPopupTagsVisible = true;
        }
      }
    }
    );
    */

    /*
    toolbarItems.push({
      location: 'before',
      widget: 'dxButton',
      locateInMenu: 'auto',
      options: {
        type: 'normal',
        hint: 'Mettre à jour le type des balises',
        text: 'Mise à jour',
        disabled: false,
        onInitialized: (e) => {
          // this.popupTagsVisible = false;
        },
        onClick: () => {
          // if(!this.tagdefDataSource || this.tagdefDataSource.length<1)
          // alert("Il faut d'abord chager un fichier");
          // else
          // this.collectTags();
          console.log("Bouton 'mise à jour'");
          // var button = document.getElementById('suggestionBox');
          // console.log(button);
          // button.style.display = 'block';
          // this.popupTagsVisible = true;
          // this.suggestionPopupTagsVisible = true;

          for(var i = 0, i_limit = this.tagdefDataSource.length ; i < i_limit ; i++){
            // if(this.tagdefDataSource[i].tag !== this.suggestionDataSource[0].choice && this.tagdefDataSource[i].type === 0){
            //   this.tagdefDataSource[i].type = 3;
            // }else if(this.tagdefDataSource[i].tag !== this.suggestionDataSource[1].choice && this.tagdefDataSource[i].type === 1){
            //   this.tagdefDataSource[i].type = 3;
            // }else if(this.tagdefDataSource[i].tag !== this.suggestionDataSource[2].choice && this.tagdefDataSource[i].type === 2){
            //   this.tagdefDataSource[i].type = 3;
            // }

            // if(this.tagdefDataSource[i].tag === this.suggestionDataSource[0].choice){
            //   if(this.tagdefDataSource[i].type === 0)
            //   this.tagdefDataSource[i].type = 3;
            // }

            if(this.tagdefDataSource[i].tag === this.suggestionDataSource[0].choice){
              this.tagdefDataSource[i].type = 0; 
            }else if(this.tagdefDataSource[i].tag === this.suggestionDataSource[1].choice){
              this.tagdefDataSource[i].type = 1; 
            }else if(this.tagdefDataSource[i].tag === this.suggestionDataSource[2].choice){
              this.tagdefDataSource[i].type = 2; 
            }else{
              this.tagdefDataSource[i].type = 3;
            }
          }
        }
      }
    }
    );
    */
    /* </LOUIS> */

  }



  onSelectionChanged(e: any) {
    if (e.currentSelectedRowKeys && e.currentSelectedRowKeys.length > 0) {
      this.addTagButtonComponent.option("disabled", false);
      this.lastSelectedTag = e.selectedRowsData[0].elem;
      this.lastSelectedAttrs = [e.selectedRowsData[0].attrs, e.selectedRowsData[0].attrsstr];
    }
    else {
      this.addTagButtonComponent.option("disabled", true);
      this.lastSelectedTag = undefined;
    }
  }





  onRowUpdated(e: any) {
    console.log(e);
    if (e.data.tag in this.docTagMap) {
      this.docTagMap[this.lastSelectedTag] = e.data.color;
      this.xmlGrid.instance.refresh();
    }
  }


  attrToString(attrs) {
    var str = ""
    for (var i = 0; i < attrs.length; i++) {
      str = str + attrs[i][0] + "=\"" + attrs[i][1] + "\" ";
    }
    return str;
  }

  recupAttrNames(attrs) {
  //  console.log("recupAttrNames attrs=", attrs);
    var anames = [];
    if(attrs==null || attrs.length==0) return anames;
    for (var a of Object.keys(attrs)) {
      anames.push(a[0]);
    }
    return anames;
  }

  normalizeAttributeName(tag, aname) {
    var attr = aname;
    if(aname == "type")
      attr = tag + "_" + attr;
      attr = attr.replace("-", "_");
      attr = attr.replace(".", "_d_");
      attr = attr.replace(":", "__");
    
    return attr.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  }


  collectTags() {

    var count=0;
    var dic: any = {};
    var tddic: any = {};

    /* <LOUIS */
    var docMinChar = 200;
    // var docMaxChar = 10000;
    var docMinQuantity = 5;
    var standardParagraphNames = ["p","par","paragraph"];
    var standardDocumentNames = ["text","body"];
    // console.log(this.tagdefDataSource);
    /* </LOUIS> */

    this.tagdefDataSource.map(e => {
      tddic[e.tag] = e.attrs;
    });

    this.docDataSource.map(e => {

      if (!(e.elem in dic)) {
        if (!(e.elem in tddic)) {
          

          var colour = this.hexToRgbA(this.getRandomColor());
          this.docTagMap[e.elem] = colour;
         // console.log("COLLECT ", e.elem, e.attrs);
          var ne = {
            id: this.tagdefDataSource.length,
            attrs: this.recupAttrNames(e.attrs),
            attrsstr: this.attrToString(e.attrs),
            tag: e.elem,
            constraint: [],
            /* <LOUIS> */
            // type: count<2 ? 0 : 3,
            // type: dic[e.elem].quantity >= docMinQuantity && dic[e.elem].averageCharCount >= docMinChar ? 0 : 3,
            type: 3,
            /* </LOUIS> */
            color: colour,
            /* <LOUIS> */
            // quantity: 0,
            quantity: 1,
            averageCharCount: 0,
            chainingRatio: 0
            /* </LOUIS */
          };
          dic[e.elem] = ne;
          this.tagdefDataSource.push(ne);

        } 
        count++;
      } else {
        // We already ran on this tag, but let's check whether all same attributes were collected
        var already = dic[e.elem].attrs;
        var ldat = {}
        already.map( i=> { ldat[i]=i } );
        var tags = this.recupAttrNames(e.attrs);
        tags.map( i=> { 
          if(!(i in ldat)) {
           // console.log("Found extra " + i + " on " + e.elem);
            dic[e.elem].attrs.push(i);
          }
         } );
         /* <LOUIS> */
         dic[e.elem].quantity++;
         dic[e.elem].averageCharCount = this.tagsAverageContentLength[e.elem].average;
        //  dic[e.elem].averageCharCount = zis.tagsAverageContentLength[e.elem];
        if(!(e.elem in this.tagsChainingRatio)){
          this.tagsChainingRatio[e.elem] = {
            count: 0,
            total_count: 0,
            ratio: 0
          };
        }
        dic[e.elem].chainingRatio = this.tagsChainingRatio[e.elem].ratio;




        
        /*  
        if(standardParagraphNames.indexOf(e.elem) !== -1){
          dic[e.elem].type = 1;
          if(this.suggestionDataSource[1].suggestions.indexOf(e.elem) === -1){
            this.suggestionDataSource[1].suggestions.push(e.elem);
            if(this.suggestionDataSource[1].suggestions_str.length > 0){
              this.suggestionDataSource[1].suggestions_str += ', ';
            }
            this.suggestionDataSource[1].suggestions_str += (e.elem);
          }
        }else if((dic[e.elem].quantity >= docMinQuantity && dic[e.elem].averageCharCount >= docMinChar) || standardDocumentNames.indexOf(e.elem) !== -1){
          dic[e.elem].type = 0;
          // console.log("doc",e.elem);
          this.suggestionDataSource[0].suggestions.push(e.elem);
          // console.log("pushed");
          if(this.suggestionDataSource[0].suggestions.indexOf(e.elem) === -1){
            if(this.suggestionDataSource[0].suggestions_str.length > 0){
              this.suggestionDataSource[0].suggestions_str += ', ';
            }
            this.suggestionDataSource[0].suggestions_str += (e.elem);
            // console.log("concatenated");
          }
        }
        */
         /* </LOUIS */
      }

      /* <LOUIS> */
      if(standardParagraphNames.indexOf(e.elem) !== -1){
        dic[e.elem].type = 1;
        if(this.suggestionDataSource[1].suggestions.indexOf(e.elem) === -1){
          // this.suggestionDataSource[1].suggestions.append(e.elem);
          this.suggestionDataSource[1].suggestions.push(e.elem);
          if(this.suggestionDataSource[1].suggestions_str.length > 0){
            this.suggestionDataSource[1].suggestions_str += ', ';
          }
          this.suggestionDataSource[1].suggestions_str += (e.elem);
        }
      }else if((dic[e.elem].quantity >= docMinQuantity && dic[e.elem].averageCharCount >= docMinChar) || standardDocumentNames.indexOf(e.elem) !== -1){
        dic[e.elem].type = 0;
        // console.log("doc",e.elem);
        if(this.suggestionDataSource[0].suggestions.indexOf(e.elem) === -1){
          // this.suggestionDataSource[0].suggestions.append(e.elem);
          this.suggestionDataSource[0].suggestions.push(e.elem);
          // console.log("pushed");
          if(this.suggestionDataSource[0].suggestions_str.length > 0){
            this.suggestionDataSource[0].suggestions_str += ', ';
          }
          this.suggestionDataSource[0].suggestions_str += (e.elem);
          // console.log("concatenated");
        }
      }
      /* </LOUIS */

    });


  }


  getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  hexToRgbA(hex) {
    var c;
    if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
      c = hex.substring(1).split('');
      if (c.length == 3) {
        c = [c[0], c[0], c[1], c[1], c[2], c[2]];
      }
      c = '0x' + c.join('');
      return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',0.5)';
    }
    throw new Error('Bad Hex');
  }






  typesystemGeneration() {

    var typeDescriptions = "";

    this.tagdefDataSource.map(e => {

      if (e.type == 3) {

        typeDescriptions = typeDescriptions + this.typeDescriptionGenerator(e.tag, e.attrs);

      }
     
    });


    this.typesystem = this.typesystemTemplate.replace("[TYPEDESCRIPTION_PLACEHOLDER]", typeDescriptions);
  }



  typeDescriptionGenerator(name, attrs): string {
    console.log("typeDescriptionGenerator for: "+ name);
    console.log(attrs);
    var description = "\n\n<typeDescription>" + "\n";
    description = description + "<name>webanno.custom." + name + "</name>" + "\n";
    description = description + "<description/>" + "\n";
    description = description + "<supertypeName>uima.tcas.Annotation</supertypeName>" + "\n";
    description = description + "<features>" + "\n";
    if(attrs && attrs.length>0)
    attrs.map(e => {
      console.log("<name>" + e + "</name>");
      description = description + "<featureDescription>" + "\n";
      description = description + "<name>" + this.normalizeAttributeName(name, e) + "</name>" + "\n";
      description = description + "<description/> " + "\n";
      description = description + "<rangeTypeName>uima.cas.String</rangeTypeName>" + "\n";
      description = description + "</featureDescription>" + "\n";
    });
    description = description + "</features>" + "\n";
    description = description + "</typeDescription>" + "\n";

    return description;
  }

  dowloadPython() {
    
    var blob = new Blob([this.pythonCode], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "split-and-convert.py");
    
   /*
   var zip = new JSZip();
    zip.file('inception_project/split-and-convert.py',this.pythonCode);
    zip.generateAsync({type: 'blob'}).then(function(content){
      saveAs(content,'test_zip.zip');
    });
    */
  }


  downloadTypesystem() {
    var blob = new Blob([this.typesystem], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "typesystem.xml");
  }

  /* <LOUIS> */

  downloadZip(){
    var zip = new JSZip();
    zip.file('inception_project/split-and-convert.py',this.pythonCode);
    zip.file('inception_project/data/typesystem.xml',this.typesystem);
    zip.file('inception_project/data/'+this.fichierXML,this.uploadedXML);
    zip.generateAsync({type: 'blob'}).then(function(content){
      saveAs(content,'inception_project.zip');
    });
  }

  updateSystem(){
    // if(!this.tagdefDataSource || this.tagdefDataSource.length<1)
    // alert("Il faut d'abord chager un fichier");
    // else
    // this.collectTags();
    // console.log("Bouton 'mise à jour'");
    // var button = document.getElementById('suggestionBox');
    // console.log(button);
    // button.style.display = 'block';
    // this.popupTagsVisible = true;
    // this.suggestionPopupTagsVisible = true;

    for(var i = 0, i_limit = this.tagdefDataSource.length ; i < i_limit ; i++){
      // if(this.tagdefDataSource[i].tag !== this.suggestionDataSource[0].choice && this.tagdefDataSource[i].type === 0){
      //   this.tagdefDataSource[i].type = 3;
      // }else if(this.tagdefDataSource[i].tag !== this.suggestionDataSource[1].choice && this.tagdefDataSource[i].type === 1){
      //   this.tagdefDataSource[i].type = 3;
      // }else if(this.tagdefDataSource[i].tag !== this.suggestionDataSource[2].choice && this.tagdefDataSource[i].type === 2){
      //   this.tagdefDataSource[i].type = 3;
      // }

      // if(this.tagdefDataSource[i].tag === this.suggestionDataSource[0].choice){
      //   if(this.tagdefDataSource[i].type === 0)
      //   this.tagdefDataSource[i].type = 3;
      // }

      if(this.tagdefDataSource[i].tag === this.suggestionDataSource[0].choice){
        this.tagdefDataSource[i].type = 0; 
      }else if(this.tagdefDataSource[i].tag === this.suggestionDataSource[1].choice){
        this.tagdefDataSource[i].type = 1; 
      }else if(this.tagdefDataSource[i].tag === this.suggestionDataSource[2].choice){
        this.tagdefDataSource[i].type = 2; 
      }else{
        this.tagdefDataSource[i].type = 3;
      }
    }

    var contrainte = false;
    for(var i = 0, i_limit = this.tagdefDataSource.length ; i < i_limit ; i++){
      if(this.tagdefDataSource[i]['tag'] === this.suggestionDataSource[0].choice){
        if(this.tagdefDataSource[i]['constraint'] === 1){
          contrainte = true;
        }else{
          contrainte = false;
        }
        break;
      }
    }

    var tag_count = 0;
    // var first_document_regex_pattern = '<'+this.suggestionDataSource[0].choice+'[\\w\\W]*(?<!</'+this.suggestionDataSource[0].choice+'>)</'+this.suggestionDataSource[0].choice+'>';
    var first_document_regex_pattern = '</?' + this.suggestionDataSource[0].choice + '(?:[ />])';
    var first_document_regex_result_list = [];
    console.log(first_document_regex_pattern);
    var first_document_regex = new RegExp(first_document_regex_pattern,'g')
    // var first_document_regex_result = first_document_regex.exec(this.full_xml);
    // if(first_document_regex_result !== null){
    //   this.first_document = first_document_regex_result[0];
    // }else{
    //   console.log("Couldn't find first document");
    // }
    var first_document_regex_result;
    while((first_document_regex_result = first_document_regex.exec(this.full_xml)) !== null){
      first_document_regex_result_list.push([first_document_regex_result.index,first_document_regex_result[0]]);
      if(first_document_regex_result[0][1] !== '/'){
        tag_count++;
      }else{
        tag_count--;
        if(contrainte){
          if(tag_count === 0){
            this.first_document = this.full_xml.slice(first_document_regex_result_list[0][0],first_document_regex_result_list[first_document_regex_result_list.length-1][0]);
            break;
          }
        }else{
          this.first_document = this.full_xml.slice(first_document_regex_result_list[first_document_regex_result_list.length-2][0],first_document_regex_result_list[first_document_regex_result_list.length-1][0]);
          break;
        }
      }
    }

    // this.firstDocumentVisible = true;

    var tag_replacement_pattern = '</?[^>]+>';
    var tag_replacement_regex = new RegExp(tag_replacement_pattern,'g');
    this.first_document = this.first_document.replace(tag_replacement_regex,'');

    // var whitespace_replacement_pattern = '\\s(\\s*)';
    var whitespace_replacement_pattern = '(\\s)\\s*';
    var whitespace_replacement_regex = new RegExp(whitespace_replacement_pattern,'g');
    this.first_document = this.first_document.replace(whitespace_replacement_regex,'$1');

    var early_whitespace_replacement_pattern = '^\\s*';
    var early_whitespace_replacement_regex = new RegExp(early_whitespace_replacement_pattern,'g');
    this.first_document = this.first_document.replace(early_whitespace_replacement_regex,'');


    for(var i = 0, i_limit = this.tagdefDataSource.length ; i < i_limit ; i++){
      if(this.tagdefDataSource[i]['tag'] === this.suggestionDataSource[0].choice){
        this.number_of_documents = this.tagdefDataSource[i]['quantity'];
        console.log("number of documents found", this.number_of_documents);
        break;
      }
    }

    var nb_doc = this.number_of_documents;

    this.firstDocumentVisible = true;
    // document.getElementById('first_document_announcer_span').style.display = 'block';
    // document.getElementById('number_of_documents_span').innerText = (~~(this.number_of_documents/2)).toString();
    var display_interval = setInterval(function(){
      /*
      var local_span = document.getElementById('number_of_documents_span');
      if(local_span !== null){
        local_span.innerText = (~~(this.number_of_documents/2)).toString();
        clearInterval(display_interval);
      }
      */
     try{
      // document.getElementById('number_of_documents_span').innerText = (~~(this.number_of_documents/2)).toString();
      document.getElementById('number_of_documents_span').innerText = (~~(nb_doc/2)).toString();
        clearInterval(display_interval);
     }catch(err){
      
     }
      console.log('interval !');
      
    },250);
    // console.log(this.number_of_documents);
  }
  /* </LOUIS> */


  generatePythonParser() {

    var finishedTopicTestPassed = false;

    var code: any = {};
    code.startTag = `
\tdef startElement(self, tag, attrs):
\t\tself.depth +=1
\t\tif attrs.getLength()>0:
`
+
// \t\t\tself.xpath.append(tag + " ["+self.attr2str(attrs)+"]")
`
\t\t\tself.xpath.append(tag + self.attr2str(attrs))
`
+
`
\t\telse:
\t\t\tself.xpath.append(tag)
`
    code.endTag = "\n\n\t"+  "def endElement(self, tag):\n";

    // import
    var imports = `
from cassis import *
import xml.sax
import re
`;

    // Variables globales
    var globales = `
TYPESYS_FILE = 'data/typesystem.xml'
CORPUS_FILE = 'data/`+this.fichierXML+`'
`
/* <LOUIS> */
+
`
file_name_no_extension = re.findall('/([^/]+)\\\\.[^\\\\.]+$',CORPUS_FILE)[0]
`
+
/* </LOUIS> */
`
OUT_DIR = "target/"
`;



// Génération tag et attributs
var defs = "";
var initCounts = "";
this.tagdefDataSource.map(t => {
  initCounts = initCounts+ "\t\tself.openedTag[\""+t.tag+"\"]=0;\n";

    if(t.type==3) {
      var line = "\t\tself.tagAnnos[\""+t.tag+"\"] = type_system.get_type('webanno.custom."+t.tag+"');\n";
      defs = defs + line;
      // Attributs ?
      if(t.attrs==undefined || t.attrs.length==0)
        line = "\t\tself.tagsAttrs[\""+t.tag+"\"] = {}";
      else {
        line = "\t\tself.tagsAttrs[\""+t.tag+"\"] = {";
        for(var a=0; a<t.attrs.length; a+=1) {
          var str = String(t.attrs[a]);
          line = line + "\""+  this.normalizeAttributeName(t.tag, str) + "\" : \""+    t.attrs[a]+"\", "; 
        }
        line = line + "};\n";
        defs = defs + line;
      }

    }
  });
// 
    // Variables de classe
var classe = `
class XML2XMIHandler(xml.sax.ContentHandler):
\tdef __init__(self, type_system, out_dir,ignore_ignorable_whitespace=False):
\t\tself.tagsAttrs = {}
\t\tself.tagAttrLastValues = {}
\t\tself.openedTag = {} ; # to manager possible relative depth constraint for tags
\t\tself.tagAnnos = {}`+"\n"+defs+"\n"+initCounts+`
\t\tself.type_system = type_system
\t\tself.out_dir = out_dir
\t\tself.ignore_whitespace = ignore_ignorable_whitespace or False
\t\tself.doc_count = 0
\t\tself.append_heading = True
\t\t# growing text that is being extracted from the xml for one doc
\t\tself.current_document_text = ''
\t\t# cas data structure that holds the current doc (text and annotations)
\t\tself.current_document_cas = None
\t\tself.anno_begin = {}
\t\tself.current_attributes = None
\t\tself.depth = 0
\t\tself.xpath = []
`;



// Cas des tags extérieurs au documents/topics
this.tagdefDataSource.map(t => {
  if(t.type==5) {
    var test = `
    \t\tif tag == '`+t.tag+`':
    \t\t\treturn`;

    code.startTag = code.startTag + test;
  }
});




   // Cas des tags frontière de documents //

    this.tagdefDataSource.map(t => {

      // <tag>
      
      // Cas d'un tag représentant les frontières de document
      if(t.type==0) {
        var c:boolean = t.constraint=="1" ? true : false;
        var test = '';
        if(c) {
          test = `\t\tif tag == '${t.tag}':
\t\t\tself.openedTag['${t.tag}'] += 1
\t\t\t# case of a document boundary tag, possibly with a depth level constraint
\t\t\tif self.openedTag['${t.tag}'] == 1:
\t\t\t\tself.current_document_cas = Cas(typesystem=self.type_system)
\t\t\t\treturn;
`;
        } else {
          test = `\t\tif tag == '${t.tag}':
\t\t\tself.current_document_cas = Cas(typesystem=self.type_system)
\t\t\treturn;
`;
                  
        }
        code.startTag = code.startTag + test;

        if(c) {
          test = `\t\tif tag == '`+t.tag+`':
\t\t\tself.openedTag['`+t.tag+`'] -= 1
`
/* <LOUIS> */
+

`\t\t\tself.depth -=1`
+

/* </LOUIS> */
`
\t\t\t# finish document
\t\t\tif `+(c?'True':'False')+` and self.openedTag['`+t.tag+`'] == 0:
\t\t\t\tself.doc_count += 1
\t\t\t\tself.write_document()
\t\t\t\tself.current_document_text = ''
\t\t\t\tself.current_document_cas = None`
/* <LOUIS> */
+
/*
\t\t\t\tself.depth -=1
ALSO REMOVED TABS AFTERWARDS
*/
/* </LOUIS> */
`
\t\t\tself.xpath.pop()
\t\t\treturn\n\n`;
        } else {
          test = `\t\tif tag == '`+t.tag+`':
\t\t\tself.openedTag['`+t.tag+`'] -= 1
\t\t\tself.doc_count += 1
\t\t\tself.write_document()
\t\t\tself.current_document_text = ''`
/* <LOUIS> */
+
`
\t\t\tself.depth -=1
`
+
/* </LOUIS> */
`
\t\t\tself.xpath.pop()
`
/* <LOUIS> */
+
`\t\t\tself.current_document_cas = None`
+
/* </LOUIS> */
`
\t\t\treturn\n\n`;
        }
        // </tag>
     code.endTag = code.endTag + test;
      }
    }
    );





     // Cas des tags annotation // 
  this.tagdefDataSource.map(t => {

    // <tag>

      if(t.type==3) {
        var test = `\t\t#Case of an annotation
\t\tif tag == "`+t.tag+`":
\t\t\tself.processStartTag(tag, attrs)
\t\t\treturn\n
`;

code.startTag = code.startTag + test;
    
     
      // </tag>
 /*     test = `\t\tif tag == '`+t.tag+`':
\t\t\tself.processEndTag(tag)
\t\t\tself.depth -=1
\t\t\tself.xpath.pop()
\t\t\treturn\n
`;

      code.endTag = code.endTag + test;
*/
      }
    });


    code.endTag = code.endTag + `\t\tif self.current_document_cas != None and tag in self.tagAnnos:
\t\t\tself.processEndTag(tag)
`
/* <LOUIS> */
+
`
\t\tself.depth -=1
`
+
`
\t\tself.xpath.pop()
`;



    var commonMethods = `
\tdef attr2str(self,attrs):
\t\tstr = ""
\t\tfor a in attrs.getNames():
`
/* <LOUIS> */
+
`
\t\t\tstr += " "
`
+
/* </LOUIS> */
`
\t\t\tstr += a;
\t\t\tstr += "=\\"";
\t\t\tstr += attrs.getValue(a);
\t\t\tstr += "\\"";
\t\treturn str;

\tdef processStartTag(self,tag, attrs):
\t\tself.anno_begin[tag+'@'+str(self.depth)] = len(self.current_document_text)
\t\tself.tagAttrLastValues[tag+'@'+str(self.depth)] = attrs

\tdef processEndTag(self,tag):
\t\tanno_end = len(self.current_document_text)
\t\tself.current_document_cas.sofa_string = self.current_document_text
\t\tif self.anno_begin[tag+'@'+str(self.depth)] < anno_end:
\t\t\tself.anno_begin[tag+'@'+str(self.depth)], anno_end = self.trim_whitespace(self.anno_begin[tag+'@'+str(self.depth)], anno_end, self.current_document_text)
\t\tif self.anno_begin[tag+'@'+str(self.depth)] > anno_end:
\t\t\tprint ("ERROR on : " , tag, "begin=", self.anno_begin[tag+'@'+str(self.depth)], "> end=",anno_end )
\t\t\tself.anno_begin[tag+'@'+str(self.depth)] = -1
\t\t\tself.tagAttrLastValues[tag+'@'+str(self.depth)] = None
\t\t\treturn
\t\tanno = self.tagAnnos[tag](begin=self.anno_begin[tag+'@'+str(self.depth)], end=anno_end)
\t\tif tag in self.tagsAttrs:
\t\t\tfor attribute in self.tagsAttrs[tag].keys():
\t\t\t\tif self.tagAttrLastValues[tag+'@'+str(self.depth)]==None or attribute not in self.tagAttrLastValues[tag+'@'+str(self.depth)]:
\t\t\t\t\tcontinue
\t\t\t\tanno.__setattr__(attribute, self.tagAttrLastValues[tag+'@'+str(self.depth)].getValueByQName(attribute))
\t\tself.current_document_cas.add_annotation(anno)
\t\tself.anno_begin[tag+'@'+str(self.depth)] = -1
\t\tself.tagAttrLastValues[tag+'@'+str(self.depth)] = None

\tdef encode_filename(self):
`
+
/* <LOUIS> */
// \t\tfilename = "doc" + str(self.doc_count) + ".xml"
`\t\tfilename = file_name_no_extension + "_doc" + str(self.doc_count) + ".xml"`
+
/* </LOUIS> */
`
\t\treturn filename

\tdef write_document(self):
\t\t"""Write current cas with current text to file with filename """
\t\tif len(self.current_document_text.strip())==0:
\t\t\treturn
\t\tfilename = self.encode_filename()
\t\tself.current_document_cas.sofa_string = self.current_document_text
\t\t#print(filename);
\t\t#print("v=======sofa_string=========================v")
\t\t#print(self.current_document_cas.sofa_string);
\t\t#print("v======current_document_cas.select_all()====v")
\t\t#print(self.current_document_cas.select_all() )
\t\t#print("v======current_document_cas.typecheck=======v")
\t\t#print(self.current_document_cas.typecheck() )
\t\t#print("v======current_document_cas._find_all_fs()===v")
\t\t#for fs in self.current_document_cas._find_all_fs():
\t\t#\tprint(fs )
\t\t#print("=====================================")
\t\tself.current_document_cas.to_xmi(self.out_dir + filename, pretty_print=True)
\t\tprint(f'Wrote doc to file {filename}.')
\t\ttraces = open(self.out_dir + filename+".trace",'w')
\t\ttraces.write(str(self.doc_count) + "\\n" )
\t\tfor t in self.xpath:
\t\t\ttraces.write(t + "\\n")
\t\ttraces.close()

\tdef trim_whitespace(self, begin, end, text):
\t\t"""move offsets so there is no leading or trailing white-space in the annotation"""
\t\twhitespace = re.compile(r'\\s')
`
+
/* <LOUIS> */
// \t\twhile whitespace.match(text[begin]) and begin+1<len(text):
`\t\twhile begin < end and whitespace.match(text[begin]):`
/* </LOUIS */
+
`
\t\t\tbegin += 1
`
+
/* <LOUIS> */
// \t\twhile whitespace.match(text[end - 1]):
`\t\twhile end > begin and whitespace.match(text[end - 1]):`
+
/* </LOUIS> */
`
\t\t\tend -= 1
\t\treturn begin, end

\tdef characters(self, content):
`
/* <LOUIS> */
+
/*\t\tself.current_document_text += content*/
`
\t\tif self.current_document_cas != None:
\t\t\tself.current_document_text += content
`
+
/* </LOUIS> */
`

\tdef ignorableWhitespace(self, whitespace):
\t\tif self.ignore_whitespace:
\t\t\treturn
\t\tself.current_document_text += whitespace`;


        var main = `\n\n\nwith open(TYPESYS_FILE, 'rb') as f:
        type_system = load_typesystem(f)
        contentHandler = XML2XMIHandler(type_system, OUT_DIR)
        xml.sax.parse(CORPUS_FILE, contentHandler)
        
        ` 

let header = "# this Python 3 code has been generated on : " + new Date();

this.pythonCode = header+imports + globales + classe + code.startTag  + code.endTag + commonMethods  + main;

  }
}

