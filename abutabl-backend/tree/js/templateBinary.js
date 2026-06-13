
window.onload = function () {
  OrgChart.templates.belinda.plus = '<circle cx="15" cy="15" r="15" fill="#ffffff" stroke="#aeaeae" stroke-width="1"></circle>'
        + '<text text-anchor="middle" style="font-size: 18px;cursor:pointer;" fill="#757575" x="15" y="22">{collapsed-children-total-count}</text>';

  OrgChart.templates.myTemplate = Object.assign({}, OrgChart.templates.ana);

  OrgChart.templates.myTemplate.size = [100, 80];
  OrgChart.toolbarUI.zoomInIcon = zoomInIcon;
  OrgChart.toolbarUI.zoomOutIcon = zoomOutIcon;
  OrgChart.templates.myTemplate.node = '<rect x="25" y="0" height="80" width="300" fill="#fcc89b" rx="15" ry="15"></rect>' + 
  '<rect x="25" y="40" height="40" width="300" fill="#cc9d80" rx="15" ry="15"></rect>' +
  '<rect x="25" y="40" height="20" width="300" fill="#cc9d80"></rect>' +
  '<circle cx="35" cy="40" r="47" fill="#d1d2d4" stroke="#fff" stroke-width="5"></circle>' +
  '<circle stroke="#939598" stroke-width="2" fill="#939598" cx="35" cy="25" r="8"></circle> ' +
  '<path d="M20,54 C20,32 50,32 50,54 L19,54" stroke="#939598" stroke-width="2" fill="#939598"></path>';

  OrgChart.templates.myTemplate.ripple = {
    radius: 15,
    color: "#0890D3",
    rect: { x: 0, y: 0, width: 25, height: 150, rx: 15, ry: 15 }
};

  OrgChart.templates.myTemplate.field_0 = '<text width="210" class="field_0" style="font-size: 18px;" font-weight="bold" fill="#322b28" x="170" y="25" text-anchor="middle">{val}</text>';
  OrgChart.templates.myTemplate.field_1 = '<text width="210" class="field_1" style="font-size: 14px;" font-weight="bold" fill="#231f20" x="170" y="60" text-anchor="middle">{val}</text>';
  OrgChart.templates.myTemplate.img_0 = '<clipPath id="{randId}"><circle cx="35" cy="40" r="46"></circle></clipPath><image preserveAspectRatio="xMidYMid slice" clip-path="url(#{randId})" xlink:href="{val}" x="-15" y="-10"  width="100" height="100"></image>';
  var chart = new OrgChart(document.getElementById("tree"), {
    collapse: {
        level: 3,
       allChildren: true,

    },
    template: "belinda",
    mixedHierarchyNodesSeparation: 0,
    mouseScrool: OrgChart.action.zoom ,
    scaleInitial: OrgChart.match.boundary,
    scaleMin: 0.2,
    scaleMax: 10,
    searchFields: ["name", "Username","id"],
    sticky: false,
    showYScroll:true,
    padding: 0,
    enableDragDrop: false,
    toolbar: {
        layout: false,
        zoom: true,
        fullScreen: true,
        expandAll: false
    },
    nodeBinding: {
        field_0: "Name",
        field_1: "Username",
        img_0: "img"
    },
    menu: {
        pdf: { 
          text: "Export PDF",
          icon: pdfIcon
        },
        png: { 
          text: "Export PNG",
          icon: pngIcon 
        },
        svg: { 
          text: "Export SVG",
          icon: svgIcon 
        },
        csv: { 
          text: "Export CSV",
          icon: csvIcon
        }
    },
    editForm: {
      titleBinding: "Name",
      photoBinding: "ImgUrl",
      buttons: {
          edit: {
              icon: OrgChart.icon.edit(24, 24, '#fff'),
              text: 'Edit',
              hideIfEditMode: true,
              hideIfDetailsMode: true
          },
          share: {
              icon: OrgChart.icon.share(24, 24, '#fff'),
              text: 'Share',
               hideIfEditMode: true,
              hideIfDetailsMode: true
          },
          pdf: {
              icon: OrgChart.icon.pdf(24, 24, '#fff'),
              text: 'Save as PDF'
          },
          remove: {
              icon: OrgChart.icon.remove(24, 24, '#fff'),
              text: 'Remove',
              hideIfEditMode: true,
              hideIfDetailsMode: true
          }
      },
      generateElementsFromFields: true,
      elements:[
        { type: 'textbox', label: lables['FullName'], binding: 'Name'},
        { type: 'textbox', label: lables['UserName'], binding: 'Username'},
        { type: 'textbox', label: lables['Email'], binding: 'Email'},
        { type: 'textbox', label: lables['Mobile'], binding: 'Mobile'},
        { type: 'textbox', label: lables['Rank'], binding: 'Rank'},
        { type: 'textbox', label: lables['CreditMoney'], binding: 'CreditMoney'},
        { type: 'textbox', label: lables['direct_cometion_value'], binding: 'direct_cometion_value'},
        { type: 'textbox', label: lables['CreditPoints'], binding: 'CreditPoints'},
        { type: 'textbox', label: lables['PVR'], binding: 'PVR'},
        { type: 'textbox', label: lables['PVL'], binding: 'PVL'},
        { type: 'textbox', label: lables['created_at'], binding: 'created_at'},
      ]

  },
  
});
 
    chart.load(nodes);


}