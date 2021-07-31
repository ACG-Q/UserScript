// ==UserScript==
// @name         Steam创意工坊mod下载工具
// @namespace    
// @version      1.0
// @description  在创意工坊中注入一个MOD下载按钮，用于下载MOD，支持下载合集, API来源：https://steamworkshopdownloader.io/
// @author       六记(原:极品小猫)
// @include      https://steamcommunity.com/sharedfiles/filedetails/*
// @include      https://steamcommunity.com/id/*/myworkshopfiles/*
// @include      https://steamcommunity.com/workshop/filedetails/*
// @match        https://steamworkshopdownloader.io/*
// @connect      *.steamworkshopdownloader.io
// @grant        GM_setClipboard
// @grant        GM_addStyle
// @grant        GM_download
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';
    let webHost=location.host, webPath=location.pathname;

    if(webHost=='steamcommunity.com') {
        if(webPath.search('myworkshopfiles')>-1) {
            document.querySelectorAll('[id^="Subscription"]').forEach(function(e, i){
                console.log(i, e, e.id);
                let mid=e.id.replace(/^[^\d]+/i,''),
                    actionsCtn=e.querySelector('.actionsCtn');

                let down_A=document.createElement('a');
                down_A.className="download_Mod";
                down_A.target='_blank';
                down_A.textContent='下载 MOD';

                let down_span=document.createElement('span');
                down_span.className='general_btn';
                down_span.style.width='70px';
                down_span.appendChild(down_A);

                actionsCtn.appendChild(down_span);

                down_A.addEventListener('click', function(){
                    ModDownloadAjax(mid);
                });
            });
        } else { //workshop详细页
            let down_A=document.createElement('a');
            //down_A.href="https://t.vvwall.com/#"+publishedfileid;
            down_A.id="download_Mod";
            down_A.target='_blank';
            down_A.textContent='下载 MOD';
            let down_span=document.createElement('span');
            down_span.className='general_btn share tooltip';
            down_span.id="download_ModBtn"
            down_span.appendChild(down_A);

            document.querySelector('#ItemControls').appendChild(down_span);
            document.querySelector('#download_ModBtn').addEventListener('click', function(){
                ModDownloadAjax(publishedfileid);
            });
        }
        
        // https://backend-01-prd.steamworkshopdownloader.io/api/details/file
        // POST []
        function ModDownloadAjax(mid){
            GM_xmlhttpRequest({
                url:'https://backend-01-prd.steamworkshopdownloader.io/api/details/file',
                method: 'post',
                data: `[${mid}]`,
                responseType : 'json',
                onload: function(e){
                    console.log(e);
                    if(!e.response){
                        alert(`获取MOD失败`)
                        return
                    }
                    let data=e.response[0], downloadTitle=`[workshop-${mid}]${data.title}.zip`;
                    // 是否为合集
                    if(data.children){
                        data.children.map((items)=>{
                            let mid = items.publishedfileid
                            ModDownloadAjax(mid)
                        })
                    }else if(data.file_url){
                        GM_download({
                            url: data.file_url,
                            name: downloadTitle,
                            saveAs : true,
                        });
                    }else{
                        alert(`获取MOD失败`)
                    }
                },
                onerror: function(e){
                    console.error('error', e);
                }
            });
        }
    } else if(webHost=='t.vvwall.com') {
        GM_addStyle(`
input[name="mid"]{
padding: 0 10px;
}
`);
        $('button.starts').click(function(){
            addMObserver('#des', function(){
                console.log($('code#des').text());
                $('code#des').html(markdown.toHTML($('code#des').text()));
            });
        });
        let workshop_A=$('<a id="workshop">').text('创意工坊');
        let dlbtn=$('#dlbtn').removeAttr('onclick target').click(function(e){
            let inputText=$('input[name="mid"]').val().trim(),
                id=getUrlParam('id', inputText, inputText),
                modTitle=$('#modtitle').text().trim(),
                downloadTitle="[workshop-"+id+"]"+modTitle+".zip";
            workshop_A.attr({'href':'https://steamcommunity.com/sharedfiles/filedetails/?id='+id});

            GM_download({
                url: e.href,
                name: downloadTitle,
                saveAs : true,
            });
            e.preventDefault(); //阻止默认动作
            e.stopPropagation(); //阻止冒泡
        });
        $('.downloadbox').prepend(dlbtn);
        dlbtn.after(workshop_A);
    }

        if(location.hash) {
            $('input[name="mid"]').val(location.hash.replace('#',''));
            $('button.starts').click();
        }
    // Your code here...
    function addMObserver(selector, callback, Kill, option) {
        var watch = document.querySelector(selector);

        if (!watch) {
            return;
        }
        console.warn('watch:', watch, selector);
        var observer = new MutationObserver(function(mutations){
            console.log('mutations:', mutations);
            var nodeAdded = mutations.some(function(x){
                console.log(x);
                return x.addedNodes.length > 0;
            });
            console.log(nodeAdded);
            if (nodeAdded) {
                console.log(mutations, observer);
                callback(mutations, observer);
                if(Kill) {
                    console.log('停止'+selector+'的监控');
                    observer.disconnect();
                }
            }
        });
        observer.observe(watch, option||{childList: true, subtree: true});//
    }

    function getUrlParam(name, url, option, newVal) {//筛选参数，url 参数为数字时
        var search = url ? url.replace(/^.+\?/,'') : location.search;
        //网址传递的参数提取，如果传入了url参数则使用传入的参数，否则使用当前页面的网址参数
        var reg = new RegExp("(?:^|&)(" + name + ")=([^&]*)(?:&|$)", "i");		//正则筛选参数
        var str = search.replace(/^\?/,'').match(reg);

        console.log(str, option);

        if (str !== null) {
            switch(option) {
                case 0:
                    return unescape(str[0]);		//所筛选的完整参数串
                case 1:
                    return unescape(str[1]);		//所筛选的参数名
                case 2:
                    return unescape(str[2]);		//所筛选的参数值
                case 'new':
                    return url.replace(str[1]+'='+str[2], str[1]+'='+newVal);
                default:
                    return unescape(str[2]);        //默认返回参数值
            }
        } else if(!str && option) {
            return option;
        } else {
            return null;
        }
    }
})();