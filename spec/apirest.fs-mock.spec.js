const request = require('supertest');
const utils = require('../src/utils');
const config = require('../config');

let spy = jest.spyOn(utils, 'getServiciosConfig');
spy.mockReturnValue([
    {
        "endpoint": "fake",
        "model": "fake",
        "pk": "id",
        "file": "fake.json"
    },
])
const serviciosConfig = utils.getServiciosConfig()

jest.mock('fs/promises');

const fichero = [{
    "id": 1,
    "name": "Burty",
    "cadena": "Phasellus in felis. Donec semper sapien a libero. Nam dui.\n\nProin leo odio, porttitor id, consequat in, consequat ut, nulla. Sed accumsan felis. Ut at dolor quis odio consequat varius.\n\nInteger ac leo. Pellentesque ultrices mattis odio. Donec vitae nisi.",
    "email": "bnottle0@businessweek.com",
    "url": "http://cloudflare.com/posuere/cubilia/curae/nulla.jpg?risus=magnis&dapibus=dis&augue=parturient&vel=montes&accumsan=nascetur&tellus=ridiculus&nisi=mus&eu=etiam&orci=vel&mauris=augue&lacinia=vestibulum&sapien=rutrum&quis=rutrum&libero=neque&nullam=aenean&sit=auctor&amet=gravida&turpis=sem&elementum=praesent&ligula=id&vehicula=massa&consequat=id&morbi=nisl&a=venenatis&ipsum=lacinia&integer=aenean&a=sit&nibh=amet&in=justo&quis=morbi&justo=ut&maecenas=odio&rhoncus=cras&aliquam=mi&lacus=pede&morbi=malesuada&quis=in&tortor=imperdiet&id=et&nulla=commodo&ultrices=vulputate&aliquet=justo&maecenas=in&leo=blandit&odio=ultrices&condimentum=enim&id=lorem&luctus=ipsum&nec=dolor&molestie=sit&sed=amet&justo=consectetuer&pellentesque=adipiscing&viverra=elit&pede=proin",
    "gender": "Male",
    "numeros": -89.95,
    "booleano": true,
    "fecha": "2015-01-22T16:12:24Z",
    "hora": "5:49 PM",
    "uuid": "482b8ef4-848e-410d-85ff-2ed5dfcfbbdb",
    "ip_address": "116.110.49.136",
    "elementos": [
        {
            "id": 1,
            "ciudad": "Vitoria-Gasteiz",
            "cp": "01005",
            "pais": "Spain"
        },
        {
            "id": 2,
            "ciudad": "Aviles",
            "cp": "33404",
            "pais": "Spain"
        }
    ]
}, {
    "id": 2,
    "name": "Holly",
    "cadena": "Praesent blandit. Nam nulla. Integer pede justo, lacinia eget, tincidunt eget, tempus vel, pede.\n\nMorbi porttitor lorem id ligula. Suspendisse ornare consequat lectus. In est risus, auctor sed, tristique in, tempus sit amet, sem.",
    "email": "hwindram1@intel.com",
    "url": "http://sbwire.com/rhoncus.js?mauris=amet&morbi=justo&non=morbi",
    "gender": "Genderqueer",
    "numeros": 90.14,
    "booleano": true,
    "fecha": "2023-04-04T05:34:47Z",
    "hora": "7:03 AM",
    "uuid": "5378a477-012f-43e8-bb30-32363d50860f",
    "ip_address": "247.213.120.113",
    "elementos": [
        {
            "id": 1,
            "ciudad": "Cadiz",
            "cp": "11010",
            "pais": "Spain"
        }
    ]
}, {
    "id": 3,
    "name": "Pansy",
    "cadena": "Morbi non lectus. Aliquam sit amet diam in magna bibendum imperdiet. Nullam orci pede, venenatis non, sodales sed, tincidunt eu, felis.",
    "email": "plunck2@people.com.cn",
    "url": "http://mysql.com/ornare/imperdiet.html?sapien=quam&varius=nec&ut=dui&blandit=luctus&non=rutrum&interdum=nulla&in=tellus&ante=in&vestibulum=sagittis&ante=dui&ipsum=vel&primis=nisl&in=duis&faucibus=ac&orci=nibh&luctus=fusce&et=lacus&ultrices=purus&posuere=aliquet&cubilia=at&curae=feugiat&duis=non&faucibus=pretium&accumsan=quis&odio=lectus&curabitur=suspendisse&convallis=potenti&duis=in&consequat=eleifend&dui=quam&nec=a&nisi=odio&volutpat=in&eleifend=hac&donec=habitasse&ut=platea&dolor=dictumst&morbi=maecenas&vel=ut&lectus=massa&in=quis&quam=augue&fringilla=luctus&rhoncus=tincidunt&mauris=nulla&enim=mollis&leo=molestie&rhoncus=lorem",
    "gender": "Female",
    "numeros": 31.24,
    "booleano": false,
    "fecha": "2012-04-10T00:46:09Z",
    "hora": "10:37 AM",
    "uuid": "8ce2c2f2-0f56-48c1-8ec1-700f8dee0dbd",
    "ip_address": "90.82.43.45",
    "elementos": [
        {
            "id": 1,
            "ciudad": "Donostia-San Sebastian",
            "cp": "20015",
            "pais": "Spain"
        },
        {
            "id": 2,
            "ciudad": "Zamora",
            "cp": "49008",
            "pais": "Spain"
        }
    ]
}, {
    "id": 4,
    "name": "Clarice",
    "cadena": "Vestibulum quam sapien, varius ut, blandit non, interdum in, ante. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Duis faucibus accumsan odio. Curabitur convallis.\n\nDuis consequat dui nec nisi volutpat eleifend. Donec ut dolor. Morbi vel lectus in quam fringilla rhoncus.\n\nMauris enim leo, rhoncus sed, vestibulum sit amet, cursus id, turpis. Integer aliquet, massa id lobortis convallis, tortor risus dapibus augue, vel accumsan tellus nisi eu orci. Mauris lacinia sapien quis libero.",
    "email": "cmonument3@about.com",
    "url": "https://ifeng.com/at/nunc/commodo/placerat/praesent.jpg?eros=nam&suspendisse=dui&accumsan=proin&tortor=leo&quis=odio&turpis=porttitor&sed=id&ante=consequat&vivamus=in&tortor=consequat&duis=ut&mattis=nulla&egestas=sed&metus=accumsan&aenean=felis&fermentum=ut&donec=at&ut=dolor",
    "gender": "Female",
    "numeros": -33.07,
    "booleano": true,
    "fecha": "2017-09-14T10:32:01Z",
    "hora": "3:53 PM",
    "uuid": "568fc922-a534-4be7-93f0-6c396b5b599d",
    "ip_address": "106.213.64.76",
    "elementos": [
        {
            "id": 1,
            "ciudad": "Coruña, A",
            "cp": "15190",
            "pais": "Spain"
        }
    ]
}, {
    "id": 5,
    "name": "Evanne",
    "cadena": "Quisque porta volutpat erat. Quisque erat eros, viverra eget, congue eget, semper rutrum, nulla. Nunc purus.\n\nPhasellus in felis. Donec semper sapien a libero. Nam dui.\n\nProin leo odio, porttitor id, consequat in, consequat ut, nulla. Sed accumsan felis. Ut at dolor quis odio consequat varius.",
    "email": "ecasemore4@statcounter.com",
    "url": "http://ebay.co.uk/malesuada/in/imperdiet/et/commodo/vulputate/justo.html?convallis=pharetra&morbi=magna&odio=ac&odio=consequat&elementum=metus&eu=sapien&interdum=ut&eu=nunc&tincidunt=vestibulum&in=ante&leo=ipsum&maecenas=primis&pulvinar=in&lobortis=faucibus&est=orci&phasellus=luctus&sit=et&amet=ultrices&erat=posuere&nulla=cubilia&tempus=curae&vivamus=mauris&in=viverra&felis=diam&eu=vitae&sapien=quam&cursus=suspendisse&vestibulum=potenti&proin=nullam&eu=porttitor&mi=lacus&nulla=at&ac=turpis&enim=donec",
    "gender": "Female",
    "numeros": 94.61,
    "booleano": false,
    "fecha": "2000-02-04T00:40:46Z",
    "hora": "12:11 AM",
    "uuid": "3ba70dc4-5f84-4c09-a545-90589e4c49f9",
    "ip_address": "130.223.70.29",
    "elementos": [
        {
            "id": 1,
            "ciudad": "Vitoria-Gasteiz",
            "cp": "01010",
            "pais": "Spain"
        }
    ]
}, {
    "id": 6,
    "name": "Aurie",
    "cadena": "Nulla ut erat id mauris vulputate elementum. Nullam varius. Nulla facilisi.\n\nCras non velit nec nisi vulputate nonummy. Maecenas tincidunt lacus at velit. Vivamus vel nulla eget eros elementum pellentesque.\n\nQuisque porta volutpat erat. Quisque erat eros, viverra eget, congue eget, semper rutrum, nulla. Nunc purus.",
    "email": "aofeeney5@wufoo.com",
    "url": "http://mozilla.com/morbi/vel/lectus/in/quam/fringilla.jpg?faucibus=augue&orci=vestibulum&luctus=ante&et=ipsum&ultrices=primis&posuere=in&cubilia=faucibus&curae=orci&donec=luctus&pharetra=et&magna=ultrices&vestibulum=posuere&aliquet=cubilia&ultrices=curae&erat=donec&tortor=pharetra&sollicitudin=magna&mi=vestibulum&sit=aliquet&amet=ultrices&lobortis=erat&sapien=tortor&sapien=sollicitudin&non=mi&mi=sit&integer=amet&ac=lobortis&neque=sapien&duis=sapien&bibendum=non&morbi=mi&non=integer&quam=ac&nec=neque&dui=duis&luctus=bibendum&rutrum=morbi&nulla=non&tellus=quam&in=nec&sagittis=dui&dui=luctus&vel=rutrum&nisl=nulla&duis=tellus&ac=in&nibh=sagittis",
    "gender": "Genderfluid",
    "numeros": 7.3,
    "booleano": true,
    "fecha": "2025-11-07T09:55:29Z",
    "hora": "11:30 PM",
    "uuid": "3e712bf2-f8e7-442e-a8e5-e6c39451270c",
    "ip_address": "61.131.57.139",
    "elementos": [
        {
            "id": 1,
            "ciudad": "Badajoz",
            "cp": "06005",
            "pais": "Spain"
        }
    ]
}, {
    "id": 7,
    "name": "Allx",
    "cadena": "Maecenas tristique, est et tempus semper, est quam pharetra magna, ac consequat metus sapien ut nunc. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Mauris viverra diam vitae quam. Suspendisse potenti.\n\nNullam porttitor lacus at turpis. Donec posuere metus vitae ipsum. Aliquam non mauris.",
    "email": "agilliam6@nature.com",
    "url": "https://delicious.com/justo.html?orci=suspendisse&eget=potenti&orci=nullam&vehicula=porttitor&condimentum=lacus&curabitur=at&in=turpis&libero=donec&ut=posuere&massa=metus&volutpat=vitae&convallis=ipsum&morbi=aliquam&odio=non&odio=mauris&elementum=morbi&eu=non&interdum=lectus&eu=aliquam&tincidunt=sit&in=amet&leo=diam&maecenas=in&pulvinar=magna&lobortis=bibendum&est=imperdiet&phasellus=nullam&sit=orci&amet=pede&erat=venenatis&nulla=non&tempus=sodales&vivamus=sed&in=tincidunt&felis=eu&eu=felis&sapien=fusce&cursus=posuere&vestibulum=felis&proin=sed&eu=lacus&mi=morbi&nulla=sem&ac=mauris&enim=laoreet&in=ut&tempor=rhoncus&turpis=aliquet&nec=pulvinar&euismod=sed&scelerisque=nisl&quam=nunc&turpis=rhoncus&adipiscing=dui&lorem=vel&vitae=sem&mattis=sed&nibh=sagittis&ligula=nam&nec=congue&sem=risus&duis=semper&aliquam=porta",
    "gender": "Female",
    "numeros": 64.22,
    "booleano": false,
    "fecha": "2016-05-26T04:09:36Z",
    "hora": "3:44 PM",
    "uuid": "41679e57-04d0-47b3-aeea-95a8b994701b",
    "ip_address": "159.136.17.213",
    "elementos": [
        {
            "id": 1,
            "ciudad": "Zamora",
            "cp": "49008",
            "pais": "Spain"
        }
    ]
}, {
    "id": 8,
    "name": "Adolphus",
    "cadena": "Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Vivamus vestibulum sagittis sapien. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.\n\nEtiam vel augue. Vestibulum rutrum rutrum neque. Aenean auctor gravida sem.",
    "email": "atunnicliff7@dailymotion.com",
    "url": "http://sitemeter.com/bibendum/morbi/non/quam/nec/dui.xml?mus=at&vivamus=lorem&vestibulum=integer&sagittis=tincidunt&sapien=ante&cum=vel&sociis=ipsum&natoque=praesent&penatibus=blandit&et=lacinia&magnis=erat&dis=vestibulum&parturient=sed&montes=magna&nascetur=at&ridiculus=nunc&mus=commodo&etiam=placerat&vel=praesent&augue=blandit&vestibulum=nam&rutrum=nulla&rutrum=integer&neque=pede&aenean=justo&auctor=lacinia&gravida=eget&sem=tincidunt&praesent=eget&id=tempus&massa=vel&id=pede&nisl=morbi&venenatis=porttitor&lacinia=lorem&aenean=id&sit=ligula&amet=suspendisse&justo=ornare&morbi=consequat&ut=lectus&odio=in&cras=est&mi=risus&pede=auctor&malesuada=sed&in=tristique&imperdiet=in&et=tempus&commodo=sit&vulputate=amet&justo=sem&in=fusce&blandit=consequat&ultrices=nulla&enim=nisl&lorem=nunc&ipsum=nisl&dolor=duis&sit=bibendum&amet=felis&consectetuer=sed&adipiscing=interdum&elit=venenatis&proin=turpis&interdum=enim&mauris=blandit&non=mi&ligula=in&pellentesque=porttitor&ultrices=pede&phasellus=justo&id=eu&sapien=massa",
    "gender": "Male",
    "numeros": 79.34,
    "booleano": false,
    "fecha": "2005-05-13T13:53:29Z",
    "hora": "8:24 PM",
    "uuid": "0a09c61a-e26b-4547-84a7-330b472d26f4",
    "ip_address": "188.11.253.232",
    "elementos": [
        {
            "id": 1,
            "ciudad": "Logroño",
            "cp": "26005",
            "pais": "Spain"
        }
    ]
}, {
    "id": 9,
    "name": "Bianca",
    "cadena": "Phasellus sit amet erat. Nulla tempus. Vivamus in felis eu sapien cursus vestibulum.\n\nProin eu mi. Nulla ac enim. In tempor, turpis nec euismod scelerisque, quam turpis adipiscing lorem, vitae mattis nibh ligula nec sem.",
    "email": "bszymonowicz8@ow.ly",
    "url": "https://rambler.ru/odio/donec.jpg?quis=consequat&tortor=dui&id=nec&nulla=nisi&ultrices=volutpat&aliquet=eleifend&maecenas=donec&leo=ut&odio=dolor&condimentum=morbi&id=vel&luctus=lectus&nec=in&molestie=quam&sed=fringilla&justo=rhoncus&pellentesque=mauris&viverra=enim&pede=leo&ac=rhoncus&diam=sed&cras=vestibulum&pellentesque=sit&volutpat=amet&dui=cursus&maecenas=id&tristique=turpis&est=integer&et=aliquet&tempus=massa&semper=id&est=lobortis&quam=convallis&pharetra=tortor&magna=risus&ac=dapibus&consequat=augue",
    "gender": "Female",
    "numeros": -99.74,
    "booleano": true,
    "fecha": "2009-08-09T07:41:30Z",
    "hora": "6:52 PM",
    "uuid": "d3ebc672-51aa-40f2-b714-81b6361f109c",
    "ip_address": "224.177.164.136",
    "elementos": [
        {
            "id": 1,
            "ciudad": "Murcia",
            "cp": "30010",
            "pais": "Spain"
        }
    ]
}, {
    "id": 10,
    "name": "Lynsey",
    "cadena": "Donec diam neque, vestibulum eget, vulputate ut, ultrices vel, augue. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Donec pharetra, magna vestibulum aliquet ultrices, erat tortor sollicitudin mi, sit amet lobortis sapien sapien non mi. Integer ac neque.\n\nDuis bibendum. Morbi non quam nec dui luctus rutrum. Nulla tellus.\n\nIn sagittis dui vel nisl. Duis ac nibh. Fusce lacus purus, aliquet at, feugiat non, pretium quis, lectus.",
    "email": "lkilfeder9@altervista.org",
    "url": "http://discuz.net/quis/odio/consequat.js?risus=nunc&semper=donec&porta=quis&volutpat=orci&quam=eget&pede=orci&lobortis=vehicula&ligula=condimentum&sit=curabitur&amet=in&eleifend=libero&pede=ut&libero=massa&quis=volutpat&orci=convallis&nullam=morbi&molestie=odio&nibh=odio&in=elementum&lectus=eu&pellentesque=interdum&at=eu&nulla=tincidunt&suspendisse=in&potenti=leo&cras=maecenas&in=pulvinar&purus=lobortis&eu=est&magna=phasellus&vulputate=sit&luctus=amet&cum=erat&sociis=nulla&natoque=tempus&penatibus=vivamus&et=in&magnis=felis&dis=eu&parturient=sapien&montes=cursus&nascetur=vestibulum&ridiculus=proin&mus=eu&vivamus=mi&vestibulum=nulla&sagittis=ac&sapien=enim&cum=in&sociis=tempor&natoque=turpis&penatibus=nec&et=euismod&magnis=scelerisque",
    "gender": "Female",
    "numeros": 47.14,
    "booleano": true,
    "fecha": "2023-02-19T08:48:40Z",
    "hora": "7:47 AM",
    "uuid": "60c6f4a0-542a-47eb-afdc-12510e46772c",
    "ip_address": "246.82.143.218",
    "elementos": [
        {
            "id": 1,
            "ciudad": "Logroño",
            "cp": "26005",
            "pais": "Spain"
        }
    ]
}, {
    "id": 11,
    "name": "Rochette",
    "cadena": "Praesent blandit. Nam nulla. Integer pede justo, lacinia eget, tincidunt eget, tempus vel, pede.\n\nMorbi porttitor lorem id ligula. Suspendisse ornare consequat lectus. In est risus, auctor sed, tristique in, tempus sit amet, sem.",
    "email": "rnisiusa@si.edu",
    "url": "https://desdev.cn/curabitur/convallis/duis/consequat/dui.json?justo=a&eu=feugiat&massa=et&donec=eros&dapibus=vestibulum&duis=ac&at=est&velit=lacinia&eu=nisi&est=venenatis&congue=tristique&elementum=fusce&in=congue&hac=diam&habitasse=id&platea=ornare&dictumst=imperdiet&morbi=sapien&vestibulum=urna&velit=pretium&id=nisl&pretium=ut&iaculis=volutpat&diam=sapien&erat=arcu&fermentum=sed&justo=augue&nec=aliquam&condimentum=erat&neque=volutpat&sapien=in&placerat=congue&ante=etiam&nulla=justo&justo=etiam&aliquam=pretium&quis=iaculis&turpis=justo&eget=in&elit=hac&sodales=habitasse&scelerisque=platea&mauris=dictumst&sit=etiam&amet=faucibus&eros=cursus&suspendisse=urna&accumsan=ut&tortor=tellus&quis=nulla&turpis=ut&sed=erat&ante=id&vivamus=mauris&tortor=vulputate&duis=elementum&mattis=nullam&egestas=varius&metus=nulla&aenean=facilisi&fermentum=cras&donec=non&ut=velit&mauris=nec&eget=nisi&massa=vulputate&tempor=nonummy&convallis=maecenas&nulla=tincidunt&neque=lacus&libero=at&convallis=velit&eget=vivamus&eleifend=vel&luctus=nulla&ultricies=eget&eu=eros&nibh=elementum&quisque=pellentesque&id=quisque&justo=porta&sit=volutpat&amet=erat&sapien=quisque&dignissim=erat&vestibulum=eros&vestibulum=viverra&ante=eget&ipsum=congue&primis=eget&in=semper&faucibus=rutrum&orci=nulla&luctus=nunc&et=purus&ultrices=phasellus&posuere=in&cubilia=felis&curae=donec",
    "gender": "Female",
    "numeros": 21.11,
    "booleano": true,
    "fecha": "2019-08-12T15:58:09Z",
    "hora": "12:39 AM",
    "uuid": "631bc087-7958-47f1-90e0-99e6755b4e25",
    "ip_address": "1.30.138.160",
    "elementos": [
        {
            "id": 1,
            "ciudad": "Leon",
            "cp": "24193",
            "pais": "Spain"
        },
        {
            "id": 2,
            "ciudad": "Lleida",
            "cp": "25005",
            "pais": "Spain"
        }
    ]
}, {
    "id": 12,
    "name": "Marcia",
    "cadena": "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Proin risus. Praesent lectus.\n\nVestibulum quam sapien, varius ut, blandit non, interdum in, ante. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Duis faucibus accumsan odio. Curabitur convallis.",
    "email": "mtravissb@odnoklassniki.ru",
    "url": "https://flickr.com/vel/dapibus/at/diam/nam.jpg?lorem=fusce&id=lacus&ligula=purus&suspendisse=aliquet&ornare=at&consequat=feugiat&lectus=non&in=pretium&est=quis&risus=lectus&auctor=suspendisse&sed=potenti&tristique=in&in=eleifend&tempus=quam&sit=a&amet=odio&sem=in&fusce=hac&consequat=habitasse&nulla=platea&nisl=dictumst&nunc=maecenas&nisl=ut&duis=massa&bibendum=quis&felis=augue&sed=luctus&interdum=tincidunt&venenatis=nulla&turpis=mollis&enim=molestie&blandit=lorem&mi=quisque&in=ut&porttitor=erat&pede=curabitur&justo=gravida&eu=nisi&massa=at&donec=nibh&dapibus=in&duis=hac&at=habitasse",
    "gender": "Bigender",
    "numeros": -59.9,
    "booleano": true,
    "fecha": "2002-05-02T12:55:15Z",
    "hora": "8:20 AM",
    "uuid": "1931c9a9-1604-438d-b35f-a127a21af8a8",
    "ip_address": "49.247.136.69",
    "elementos": [

    ]
}, {
    "id": 13,
    "name": "Elsey",
    "cadena": "Morbi porttitor lorem id ligula. Suspendisse ornare consequat lectus. In est risus, auctor sed, tristique in, tempus sit amet, sem.\n\nFusce consequat. Nulla nisl. Nunc nisl.\n\nDuis bibendum, felis sed interdum venenatis, turpis enim blandit mi, in porttitor pede justo eu massa. Donec dapibus. Duis at velit eu est congue elementum.",
    "email": "ewoollendsc@nytimes.com",
    "url": "http://sun.com/orci/luctus.js?purus=non&aliquet=sodales&at=sed&feugiat=tincidunt&non=eu&pretium=felis&quis=fusce&lectus=posuere&suspendisse=felis&potenti=sed&in=lacus&eleifend=morbi&quam=sem&a=mauris&odio=laoreet&in=ut&hac=rhoncus&habitasse=aliquet&platea=pulvinar&dictumst=sed&maecenas=nisl&ut=nunc&massa=rhoncus&quis=dui&augue=vel&luctus=sem&tincidunt=sed&nulla=sagittis&mollis=nam&molestie=congue&lorem=risus&quisque=semper&ut=porta&erat=volutpat&curabitur=quam&gravida=pede&nisi=lobortis&at=ligula&nibh=sit&in=amet&hac=eleifend&habitasse=pede&platea=libero&dictumst=quis&aliquam=orci",
    "gender": "Female",
    "numeros": 51.08,
    "booleano": true,
    "fecha": "2029-04-24T10:31:00Z",
    "hora": "10:40 PM",
    "uuid": "9f568175-0d27-487d-8f36-c711be0ea408",
    "ip_address": "152.71.34.53",
    "elementos": [
        {
            "id": 1,
            "ciudad": "Toledo",
            "cp": "45071",
            "pais": "Spain"
        }
    ]
}, {
    "id": 14,
    "name": "Frankie",
    "cadena": "Sed sagittis. Nam congue, risus semper porta volutpat, quam pede lobortis ligula, sit amet eleifend pede libero quis orci. Nullam molestie nibh in lectus.\n\nPellentesque at nulla. Suspendisse potenti. Cras in purus eu magna vulputate luctus.\n\nCum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Vivamus vestibulum sagittis sapien. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.",
    "email": "fgregoryd@reuters.com",
    "url": "https://microsoft.com/lacinia/erat.json?sapien=natoque&placerat=penatibus&ante=et&nulla=magnis&justo=dis&aliquam=parturient&quis=montes&turpis=nascetur&eget=ridiculus&elit=mus&sodales=vivamus&scelerisque=vestibulum&mauris=sagittis&sit=sapien&amet=cum&eros=sociis&suspendisse=natoque&accumsan=penatibus&tortor=et&quis=magnis&turpis=dis&sed=parturient&ante=montes&vivamus=nascetur&tortor=ridiculus&duis=mus&mattis=etiam&egestas=vel&metus=augue&aenean=vestibulum&fermentum=rutrum&donec=rutrum&ut=neque&mauris=aenean&eget=auctor&massa=gravida&tempor=sem&convallis=praesent&nulla=id&neque=massa&libero=id&convallis=nisl&eget=venenatis&eleifend=lacinia&luctus=aenean&ultricies=sit&eu=amet&nibh=justo&quisque=morbi&id=ut&justo=odio&sit=cras&amet=mi&sapien=pede&dignissim=malesuada&vestibulum=in&vestibulum=imperdiet&ante=et&ipsum=commodo&primis=vulputate&in=justo&faucibus=in&orci=blandit&luctus=ultrices&et=enim&ultrices=lorem&posuere=ipsum&cubilia=dolor&curae=sit&nulla=amet&dapibus=consectetuer&dolor=adipiscing&vel=elit&est=proin&donec=interdum&odio=mauris&justo=non&sollicitudin=ligula&ut=pellentesque&suscipit=ultrices&a=phasellus&feugiat=id&et=sapien&eros=in&vestibulum=sapien&ac=iaculis&est=congue",
    "gender": "Female",
    "numeros": 35.41,
    "booleano": true,
    "fecha": "2005-03-08T03:25:55Z",
    "hora": "7:56 AM",
    "uuid": "fdbea9e9-fc99-4b37-a14d-eb5595a80710",
    "ip_address": "236.173.183.253",
    "elementos": [

    ]
}, {
    "id": 15,
    "name": "Clint",
    "cadena": "Quisque porta volutpat erat. Quisque erat eros, viverra eget, congue eget, semper rutrum, nulla. Nunc purus.",
    "email": "cbrumfitte@wunderground.com",
    "url": "https://shutterfly.com/vestibulum/rutrum/rutrum/neque/aenean/auctor/gravida.js?volutpat=morbi&sapien=odio&arcu=odio&sed=elementum&augue=eu&aliquam=interdum&erat=eu&volutpat=tincidunt&in=in&congue=leo&etiam=maecenas&justo=pulvinar&etiam=lobortis&pretium=est&iaculis=phasellus&justo=sit&in=amet&hac=erat&habitasse=nulla&platea=tempus&dictumst=vivamus&etiam=in&faucibus=felis&cursus=eu&urna=sapien&ut=cursus&tellus=vestibulum&nulla=proin&ut=eu&erat=mi&id=nulla&mauris=ac&vulputate=enim&elementum=in&nullam=tempor&varius=turpis&nulla=nec&facilisi=euismod&cras=scelerisque&non=quam&velit=turpis&nec=adipiscing&nisi=lorem&vulputate=vitae&nonummy=mattis&maecenas=nibh&tincidunt=ligula&lacus=nec&at=sem&velit=duis&vivamus=aliquam&vel=convallis&nulla=nunc&eget=proin&eros=at&elementum=turpis&pellentesque=a&quisque=pede&porta=posuere&volutpat=nonummy&erat=integer&quisque=non&erat=velit&eros=donec&viverra=diam&eget=neque&congue=vestibulum&eget=eget&semper=vulputate&rutrum=ut&nulla=ultrices&nunc=vel&purus=augue&phasellus=vestibulum&in=ante&felis=ipsum",
    "gender": "Genderqueer",
    "numeros": 78.35,
    "booleano": false,
    "fecha": "2000-11-26T08:37:52Z",
    "hora": "9:42 AM",
    "uuid": "9e01a708-0b39-409c-a250-6f195e18b222",
    "ip_address": "192.164.209.185",
    "elementos": [
        {
            "id": 1,
            "ciudad": "Salamanca",
            "cp": "37005",
            "pais": "Spain"
        },
        {
            "id": 2,
            "ciudad": "Palmas De Gran Canaria, Las",
            "cp": "35070",
            "pais": "Spain"
        }
    ]
}, {
    "id": 16,
    "name": "Cob",
    "cadena": "Maecenas ut massa quis augue luctus tincidunt. Nulla mollis molestie lorem. Quisque ut erat.\n\nCurabitur gravida nisi at nibh. In hac habitasse platea dictumst. Aliquam augue quam, sollicitudin vitae, consectetuer eget, rutrum at, lorem.\n\nInteger tincidunt ante vel ipsum. Praesent blandit lacinia erat. Vestibulum sed magna at nunc commodo placerat.",
    "email": "cblincowef@nymag.com",
    "url": "https://php.net/justo/nec/condimentum/neque/sapien/placerat/ante.json?in=tristique&felis=est&eu=et&sapien=tempus&cursus=semper&vestibulum=est&proin=quam&eu=pharetra&mi=magna&nulla=ac&ac=consequat&enim=metus&in=sapien&tempor=ut&turpis=nunc&nec=vestibulum&euismod=ante&scelerisque=ipsum&quam=primis&turpis=in&adipiscing=faucibus&lorem=orci&vitae=luctus&mattis=et&nibh=ultrices&ligula=posuere&nec=cubilia&sem=curae&duis=mauris&aliquam=viverra&convallis=diam&nunc=vitae&proin=quam&at=suspendisse&turpis=potenti&a=nullam&pede=porttitor&posuere=lacus&nonummy=at&integer=turpis&non=donec&velit=posuere&donec=metus&diam=vitae&neque=ipsum&vestibulum=aliquam&eget=non&vulputate=mauris&ut=morbi",
    "gender": "Male",
    "numeros": -46.17,
    "booleano": false,
    "fecha": "2015-08-18T09:21:17Z",
    "hora": "6:59 PM",
    "uuid": "0bdb4afb-5d0e-4a33-b0f9-c7ea274e17e8",
    "ip_address": "72.40.23.205",
    "elementos": [

    ]
}, {
    "id": 17,
    "name": "Flor",
    "cadena": "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Proin risus. Praesent lectus.\n\nVestibulum quam sapien, varius ut, blandit non, interdum in, ante. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Duis faucibus accumsan odio. Curabitur convallis.",
    "email": "fmcgoong@state.gov",
    "url": "http://fc2.com/luctus/et.js?integer=pede&tincidunt=libero&ante=quis&vel=orci&ipsum=nullam&praesent=molestie&blandit=nibh&lacinia=in&erat=lectus&vestibulum=pellentesque&sed=at&magna=nulla&at=suspendisse&nunc=potenti&commodo=cras&placerat=in&praesent=purus&blandit=eu&nam=magna&nulla=vulputate&integer=luctus&pede=cum",
    "gender": "Female",
    "numeros": 55.34,
    "booleano": true,
    "fecha": "2025-11-27T07:05:47Z",
    "hora": "10:00 AM",
    "uuid": "3bc74da8-79bb-4dd4-891f-068e024de2da",
    "ip_address": "149.174.107.56",
    "elementos": [
        {
            "id": 1,
            "ciudad": "Lleida",
            "cp": "25193",
            "pais": "Spain"
        }
    ]
}, {
    "id": 18,
    "name": "Archy",
    "cadena": "Morbi non lectus. Aliquam sit amet diam in magna bibendum imperdiet. Nullam orci pede, venenatis non, sodales sed, tincidunt eu, felis.",
    "email": "aegginsh@dion.ne.jp",
    "url": "https://a8.net/odio/porttitor/id/consequat.jpg?vitae=vestibulum&quam=eget&suspendisse=vulputate&potenti=ut&nullam=ultrices&porttitor=vel&lacus=augue&at=vestibulum&turpis=ante&donec=ipsum&posuere=primis&metus=in&vitae=faucibus&ipsum=orci&aliquam=luctus&non=et&mauris=ultrices&morbi=posuere&non=cubilia&lectus=curae&aliquam=donec&sit=pharetra&amet=magna&diam=vestibulum&in=aliquet&magna=ultrices&bibendum=erat&imperdiet=tortor&nullam=sollicitudin&orci=mi&pede=sit&venenatis=amet&non=lobortis&sodales=sapien&sed=sapien&tincidunt=non&eu=mi&felis=integer&fusce=ac&posuere=neque&felis=duis&sed=bibendum&lacus=morbi&morbi=non&sem=quam&mauris=nec&laoreet=dui&ut=luctus&rhoncus=rutrum&aliquet=nulla&pulvinar=tellus&sed=in&nisl=sagittis&nunc=dui&rhoncus=vel&dui=nisl&vel=duis&sem=ac&sed=nibh&sagittis=fusce&nam=lacus&congue=purus&risus=aliquet&semper=at&porta=feugiat&volutpat=non&quam=pretium&pede=quis&lobortis=lectus&ligula=suspendisse&sit=potenti&amet=in&eleifend=eleifend&pede=quam&libero=a&quis=odio&orci=in&nullam=hac&molestie=habitasse&nibh=platea&in=dictumst&lectus=maecenas&pellentesque=ut",
    "gender": "Male",
    "numeros": 97.05,
    "booleano": false,
    "fecha": "2020-09-18T00:51:25Z",
    "hora": "6:52 PM",
    "uuid": "e8ab7d6a-6b71-4917-9f4b-9261fe52e951",
    "ip_address": "59.92.143.50",
    "elementos": [

    ]
}, {
    "id": 19,
    "name": "Albert",
    "cadena": "Mauris enim leo, rhoncus sed, vestibulum sit amet, cursus id, turpis. Integer aliquet, massa id lobortis convallis, tortor risus dapibus augue, vel accumsan tellus nisi eu orci. Mauris lacinia sapien quis libero.",
    "email": "aselleki@rediff.com",
    "url": "http://gravatar.com/aliquam.aspx?ipsum=tincidunt&primis=eget&in=tempus&faucibus=vel&orci=pede&luctus=morbi&et=porttitor&ultrices=lorem&posuere=id&cubilia=ligula&curae=suspendisse&mauris=ornare&viverra=consequat&diam=lectus&vitae=in&quam=est&suspendisse=risus&potenti=auctor&nullam=sed&porttitor=tristique&lacus=in&at=tempus&turpis=sit&donec=amet&posuere=sem&metus=fusce&vitae=consequat&ipsum=nulla&aliquam=nisl&non=nunc&mauris=nisl&morbi=duis&non=bibendum&lectus=felis&aliquam=sed&sit=interdum&amet=venenatis&diam=turpis&in=enim&magna=blandit&bibendum=mi&imperdiet=in&nullam=porttitor&orci=pede&pede=justo&venenatis=eu&non=massa&sodales=donec&sed=dapibus&tincidunt=duis&eu=at&felis=velit&fusce=eu&posuere=est&felis=congue&sed=elementum&lacus=in&morbi=hac&sem=habitasse&mauris=platea&laoreet=dictumst&ut=morbi&rhoncus=vestibulum&aliquet=velit&pulvinar=id&sed=pretium&nisl=iaculis&nunc=diam&rhoncus=erat&dui=fermentum&vel=justo&sem=nec&sed=condimentum&sagittis=neque&nam=sapien&congue=placerat&risus=ante&semper=nulla&porta=justo&volutpat=aliquam&quam=quis&pede=turpis&lobortis=eget&ligula=elit",
    "gender": "Male",
    "numeros": 78.69,
    "booleano": false,
    "fecha": "2019-05-31T22:18:56Z",
    "hora": "2:17 AM",
    "uuid": "cbe9df53-3864-411a-b6c7-c60d8f1aa3b1",
    "ip_address": "228.29.164.163",
    "elementos": [
        {
            "id": 1,
            "ciudad": "Sant Cugat Del Valles",
            "cp": "08190",
            "pais": "Spain"
        }
    ]
}, {
    "id": 29,
    "name": "Abe",
    "cadena": "Proin eu mi. Nulla ac enim. In tempor, turpis nec euismod scelerisque, quam turpis adipiscing lorem, vitae mattis nibh ligula nec sem.\n\nDuis aliquam convallis nunc. Proin at turpis a pede posuere nonummy. Integer non velit.",
    "email": "aduleyj@jalbum.net",
    "url": "https://independent.co.uk/accumsan.js?justo=tempus&etiam=sit&pretium=amet&iaculis=sem&justo=fusce&in=consequat&hac=nulla&habitasse=nisl&platea=nunc&dictumst=nisl&etiam=duis&faucibus=bibendum&cursus=felis&urna=sed&ut=interdum&tellus=venenatis&nulla=turpis&ut=enim&erat=blandit&id=mi&mauris=in&vulputate=porttitor&elementum=pede&nullam=justo&varius=eu&nulla=massa&facilisi=donec&cras=dapibus&non=duis&velit=at&nec=velit&nisi=eu&vulputate=est&nonummy=congue&maecenas=elementum&tincidunt=in&lacus=hac&at=habitasse&velit=platea&vivamus=dictumst&vel=morbi&nulla=vestibulum&eget=velit&eros=id",
    "gender": "Male",
    "numeros": -97.2,
    "booleano": false,
    "fecha": "2003-03-26T03:16:37Z",
    "hora": "12:14 PM",
    "uuid": "f13a91d2-736b-461d-be07-20ed501f4dd2",
    "ip_address": "80.209.249.197",
    "elementos": [
        {
            "id": 1,
            "ciudad": "Santander",
            "cp": "39005",
            "pais": "Spain"
        },
        {
            "id": 2,
            "ciudad": "Vitoria-Gasteiz",
            "cp": "01010",
            "pais": "Spain"
        }
    ]
}]
const getFichero = () => {
    return fichero;
}
describe('API Rest: Ficheros simulados', () => {
    const app = require('../src/app');
    let fsMock

    beforeEach(() => {
        jest.mock('fs/promises');
        fsMock = require('fs/promises')
        fsMock.__setMockFiles({
            '../data/__servicios.json': JSON.stringify(serviciosConfig),
            './data/fake.json': JSON.stringify(getFichero()),
        });
    });

    describe('GET', () => {
        describe('OK', () => {
            it('Sin paginar', done => {
                request(app)
                    .get(`${config.paths.API_REST}/fake`)
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .then(response => {
                        expect(response.body.length).toBe(20)
                        done();
                    })
                    .catch(err => done(err))
            });
            it('Paginar', done => {
                request(app)
                    .get(`${config.paths.API_REST}/fake?_page=1&_rows=19`)
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .then(response => {
                        expect(response.body.content.length).toBe(1)
                        done();
                    })
                    .catch(err => done(err))
            });
            it('Contar paginas', done => {
                request(app)
                    .get(`${config.paths.API_REST}/fake?_page=count`)
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .then(response => {
                        expect(response.body.pages).toBe(1)
                        done();
                    })
                    .catch(err => done(err))
            });
            it('Buscar', done => {
                request(app)
                    .get(`${config.paths.API_REST}/fake?_search=Zamora`)
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .then(response => {
                        // console.log(response.body)
                        expect(response.body.length).toBe(2)
                        done();
                    })
                    .catch(err => done(err))
            });
            it('Filtrar', done => {
                request(app)
                    .get(`${config.paths.API_REST}/fake?gender=Female&booleano=true`)
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .then(response => {
                        // console.log(response.body)
                        expect(response.body.length).toBe(7)
                        done();
                    })
                    .catch(err => done(err))
            });
            it('Ordenar asc', done => {
                request(app)
                    .get(`${config.paths.API_REST}/fake?_sort=gender,name`)
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .then(response => {
                        expect(response.body[0].id).toBe(12)
                        done();
                    })
                    .catch(err => done(err))
            });
            it('Ordenar desc', done => {
                request(app)
                    .get(`${config.paths.API_REST}/fake?_sort=-gender,name`)
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .then(response => {
                        expect(response.body[0].id).toBe(29)
                        done();
                    })
                    .catch(err => done(err))
            });
            it('Proyecciones', done => {
                request(app)
                    .get(`${config.paths.API_REST}/fake?_projection=gender,name`)
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .then(response => {
                        // console.log(response.body[0])
                        expect(Object.keys(response.body[0]).length).toBe(2)
                        done();
                    })
                    .catch(err => done(err))
            });
            it('Proyecciones con paginación', done => {
                request(app)
                    .get(`${config.paths.API_REST}/fake?_projection=gender,name&_page=all`)
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .then(response => {
                        // console.log(response.body[0])
                        expect(Object.keys(response.body.content[0]).length).toBe(2)
                        done();
                    })
                    .catch(err => done(err))
            });
            it('Uno', done => {
                request(app)
                    .get(`${config.paths.API_REST}/fake/5`)
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .then(response => {
                        expect(response.body).toEqual(fichero[4])
                        done();
                    })
                    .catch(err => done(err))
            });
            it('Uno con proyección', done => {
                request(app)
                    .get(`${config.paths.API_REST}/fake/2?_projection=id,name,url`)
                    .expect(200)
                    .expect('Content-Type', /json/)
                    .then(response => {
                        expect(Object.keys(response.body).length).toBe(3)
                        expect(response.body.id).toEqual(fichero[1].id)
                        expect(response.body.name).toEqual(fichero[1].name)
                        expect(response.body.url).toEqual(fichero[1].url)
                        done();
                    })
                    .catch(err => done(err))
            });
        })
        describe('KO', () => {
            it('Uno no encontrado', done => {
                request(app)
                    .get(`${config.paths.API_REST}/fake/999`)
                    .expect(404, done)
            });
        })
    })
    describe('POST', () => {
        describe('OK', () => {
            it('Con id=0', done => {
                request(app)
                    .post(`${config.paths.API_REST}/fake`)
                    .set('Content-Type', 'application/json')
                    .send({ "id": "0", "name": "Nuevo" })
                    .expect(201)
                    .then(response => {
                        expect(response.headers['location'].endsWith('/fake/30')).toBeTruthy()
                        let data = JSON.parse(fsMock.__getMockFile('./data/fake.json'))
                        expect(data.length).toBe(21);
                        expect(data[20].id).toBe(30)
                        expect(data[20].name).toBe('Nuevo')
                        done();
                    })
                    .catch(err => done(err))
            });
            it('Sin id', done => {
                request(app)
                    .post(`${config.paths.API_REST}/fake`)
                    .set('Content-Type', 'application/json')
                    .send({ "name": "Otro" })
                    .expect(201)
                    .then(response => {
                        expect(response.headers['location'].endsWith('/fake/30')).toBeTruthy()
                        let data = JSON.parse(fsMock.__getMockFile('./data/fake.json'))
                        expect(data.length).toBe(21);
                        expect(data[20].id).toBe(30)
                        expect(data[20].name).toBe('Otro')
                        done();
                    })
                    .catch(err => done(err))
            });
            it('Con id nuevo', done => {
                request(app)
                    .post(`${config.paths.API_REST}/fake`)
                    .set('Content-Type', 'application/json')
                    .send({ id: 99, name: 'Nuevo' })
                    .expect(201)
                    .then(response => {
                        expect(response.headers['location'].endsWith('/fake/99')).toBeTruthy()
                        let data = JSON.parse(fsMock.__getMockFile('./data/fake.json'))
                        expect(data.length).toBe(21);
                        expect(data[20].id).toBe(99)
                        expect(data[20].name).toBe('Nuevo')
                        done();
                    })
                    .catch(err => done(err))
            });
        })
        describe('KO', () => {
            it('Duplicate key', done => {
                request(app)
                    .post(`${config.paths.API_REST}/fake`)
                    .set('Content-Type', 'application/json')
                    .send({ "id": "1", "name": "Nuevo" })
                    .expect(400)
                    .expect(response => expect(response.body.detail).toBe('Duplicate key'))
                    .end(done)
            });
            it('Sin Content-Type: application/json', done => {
                request(app)
                    .post(`${config.paths.API_REST}/fake`)
                    .send('Nuevo')
                    .expect(406)
                    .end(done)
            });
            it('Sin body', done => {
                request(app)
                    .post(`${config.paths.API_REST}/fake`)
                    .set('Content-Type', 'application/json')
                    .expect(400)
                    .end(done)
            });
        })
    })
    describe('PUT', () => {
        describe('OK', () => {
            it('Con id', done => {
                const item = { "id": "1", "name": "Nuevo" }
                request(app)
                    .put(`${config.paths.API_REST}/fake/1`)
                    .set('Content-Type', 'application/json')
                    .send(item)
                    .expect(204)
                    .then(response => {
                        expect(response.body).toEqual({})
                        done();
                    })
                    .catch(err => done(err))
            });
            it('Sin id', done => {
                const item = { "id": "1", "name": "Nuevo" }
                request(app)
                    .put(`${config.paths.API_REST}/fake`)
                    .set('Content-Type', 'application/json')
                    .send(item)
                    .expect(200)
                    .then(response => {
                        let data = JSON.parse(fsMock.__getMockFile('./data/fake.json'))
                        expect(data.length).toBe(20);
                        expect(item).toEqual(response.body)
                        expect(data[0]).toEqual(item)
                        done();
                    })
                    .catch(err => done(err))
            });
        })
        describe('KO', () => {
            it('Invalid identifier', done => {
                request(app)
                    .put(`${config.paths.API_REST}/fake/2`)
                    .set('Content-Type', 'application/json')
                    .send({ "id": "1", "name": "Nuevo" })
                    .expect(400)
                    .expect(response => expect(response.body.detail).toBe('Invalid identifier'))
                    .end(done)
            });
            it('No encontrado: con id', done => {
                request(app)
                    .put(`${config.paths.API_REST}/fake/222`)
                    .set('Content-Type', 'application/json')
                    .send({ "id": "222", "name": "Nuevo" })
                    .expect(404)
                    .end(done)
            });
            it('No encontrado: sin id', done => {
                request(app)
                    .put(`${config.paths.API_REST}/fake`)
                    .set('Content-Type', 'application/json')
                    .send({ "id": "222", "name": "Nuevo" })
                    .expect(404)
                    .end(done)
            });
            it('Sin body: con id', done => {
                request(app)
                    .put(`${config.paths.API_REST}/fake/1`)
                    .set('Content-Type', 'application/json')
                    .expect(400)
                    .end(done)
            });
            it('Sin body: sin id', done => {
                request(app)
                    .put(`${config.paths.API_REST}/fake`)
                    .set('Content-Type', 'application/json')
                    .expect(400)
                    .expect(response => expect(response.body.detail).toBe('Invalid identifier'))
                    .end(done)
            });
        })
    })
    describe('PATCH', () => {
        describe('OK', () => {
            it('Con id', done => {
                const item = { "id": 1, "name": "Nuevo" }
                request(app)
                    .patch(`${config.paths.API_REST}/fake/1`)
                    .set('Content-Type', 'application/json')
                    .send(item)
                    .expect(200)
                    .then(response => {
                        let data = JSON.parse(fsMock.__getMockFile('./data/fake.json'))
                        expect(data.length).toBe(20);
                        expect(data[0]).toEqual(response.body)
                        for (let cmp in data[0]) {
                            expect(data[0][cmp]).toEqual(item[cmp] ? item[cmp] : fichero[0][cmp])
                        }
                        done();
                    })
                    .catch(err => done(err))
            });
            it('Sin id', done => {
                const item = { "name": "Nuevo" }
                request(app)
                    .patch(`${config.paths.API_REST}/fake/1`)
                    .set('Content-Type', 'application/json')
                    .send(item)
                    .expect(200)
                    .then(response => {
                        let data = JSON.parse(fsMock.__getMockFile('./data/fake.json'))
                        expect(data.length).toBe(20);
                        expect(data[0]).toEqual(response.body)
                        for (let cmp in data[0]) {
                            expect(data[0][cmp]).toEqual(item[cmp] ? item[cmp] : fichero[0][cmp])
                        }
                        done();
                    })
                    .catch(err => done(err))
            });
        })
        describe('KO', () => {
            it('Invalid identifier', done => {
                request(app)
                    .patch(`${config.paths.API_REST}/fake/2`)
                    .set('Content-Type', 'application/json')
                    .send({ "id": "1", "name": "Nuevo" })
                    .expect(400)
                    .expect(response => expect(response.body.detail).toBe('Invalid identifier'))
                    .end(done)
            });
            it('No encontrado: con id', done => {
                request(app)
                    .patch(`${config.paths.API_REST}/fake/222`)
                    .set('Content-Type', 'application/json')
                    .send({ "id": "222", "name": "Nuevo" })
                    .expect(404)
                    .end(done)
            });
            it('No encontrado: sin id', done => {
                request(app)
                    .patch(`${config.paths.API_REST}/fake/222`)
                    .set('Content-Type', 'application/json')
                    .send({ "name": "Nuevo" })
                    .expect(404)
                    .end(done)
            });
            it('Sin body', done => {
                request(app)
                    .patch(`${config.paths.API_REST}/fake/1`)
                    .set('Content-Type', 'application/json')
                    .expect(400)
                    .end(done)
            });
        })
    })
    describe('DELETE', () => {
        describe('OK', () => {
            it('Exite', done => {
                request(app)
                    .delete(`${config.paths.API_REST}/fake/5`)
                    .expect(204)
                    .then(() => {
                        let data = JSON.parse(fsMock.__getMockFile('./data/fake.json'))
                        expect(data.length).toBe(19);
                        expect(data.find(item => item.id === 5)).toBeUndefined()
                        done();
                    })
                    .catch(err => done(err))
            });
        })
        describe('KO', () => {
            it('No encontrado', done => {
                request(app)
                    .delete(`${config.paths.API_REST}/fake/222`)
                    .expect(404)
                    .end(done)
            });
        })
    })
    describe('OPTIONS', () => {
        it('Con id', done => {
            request(app)
                .options(`${config.paths.API_REST}/fake/1`)
                .expect(200)
                .end(done)
        });
        it('Sin id', done => {
            request(app)
                .options(`${config.paths.API_REST}/fake`)
                .expect(200)
                .end(done)
        });
    })
});
