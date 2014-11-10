
$(function(){
	var inputValue,
		valueArr = [],
		path = '',path1='',path2='';
	//记录上下键的指针
	var pointer = valueArr.length;
    var editor;
    var dir='/';
	var home;
	var user;
	var in_edit = false;
	var PS1 = 'USER@webshell:DIR $ ';
    String.prototype.startsWith=function(str){
        var reg=new RegExp("^"+str);
        return reg.test(this);
   	 }
	String.prototype.endsWith=function(str){
        var reg=new RegExp(str+"$");
        return reg.test(this);
   	 }
	$.post=function (e,r,i,err,s){return $.isFunction(r)&&(s=s||i,i=r,r=t),$.ajax({type:"POST",url:e,data:r,headers:{'X-PWD':dir},success:i,error:err,dataType:s})}
	$.get=function (e,r,i,err,s){return $.isFunction(r)&&(s=s||i,i=r,r=t),$.ajax({type:"GET",url:e,headers:{'X-PWD':dir},data:r,success:i,error:err,dataType:s})}

	function realBasename(p){
		if(p==home) return '~';
		else return p=='/'?'/':p.split('/').pop();
	}


    //初始化
    $.post("/cmd/exec",{data:'echo ~'},function(response){
        dir = response.replace('\n','');
		home = dir;
		console.log("init->"+dir);
		$.post(
			   "/cmd/exec",
			   {data:'whoami'},
			   function(response){
					user = response.replace('\n','');
					appendToBox();
       		});
		
		/*$.post(
            "/cmd/exec",
            {data:'pwd'},
            function(response){
                home = response.replace('\n','');
				dir = home;
				buildPS1();
		});*/
    });
    

	function editCode(filename){
        function sendFile(ctx,bol){
        	console.log(filename);
        	var bytesArray = new Uint8Array(ctx.length);
			for (var i = 0, l = ctx.length; i < l; i++) {
			  bytesArray[i] = ctx[i];
			}
            $.ajax({
                url:'/cmd/savefile?'+filename,
                type:'POST',
                headers:{'X-PWD':dir},
                contentType:'application/octet-stream',
                data: ctx,
   				processData: false,
                success:function(res){
                    if(bol){
                        editor = null;
                        $('.CodeMirror').remove();
                        $('.button-group').hide();
                    }
                    console.log('1232132131');
                    alert('保存成功！');
            }});
        }
        if(!in_edit){
			$.get(
				'/cmd/readfile',
				{data:filename},
				function(res){
					console.log(res);
					//in_edit = true;
					$('#J_mirror').val(res);
					editor = CodeMirror.fromTextArea(document.getElementById("J_mirror"), {
						mode: "python",
						lineNumbers: true,
						lineWrapping:true,
						theme:"ambiance",
						indentUnit:4,
						autofocus:true
					});
					editor.setSize(800,400);
					$('.button-group').show();
					$('#J_save').on('click',function(){
						editor.save();
						sendFile($('#J_mirror').val(),false);
					});
					$('#J_saveAndBack').on('click',function(){
						editor.save();
						sendFile($('#J_mirror').val(),true);

					});
					$('#J_back').on('click',function(){
						//hideOrShow(true);
						editor = null;
						$('.CodeMirror').remove();
						$('.button-group').hide();
					});
					 appendToBox();
					 $('html, body, .content').animate({scrollTop: $(document).height()}, 500);
			},function(jqXHR, textStatus, errorThrown){
					appendToBox('***An error occured.('+jqXHR.status+')***\n');
			});
        }else{
        	alert("已经打开了文档");
        }

//		$.get('./editcode/'+filename,function(res){
//            console.log(res);
//            $('#J_mirror').val(res);
//            editor = CodeMirror.fromTextArea(document.getElementById("J_mirror"), {
//                mode: "python",
//                lineNumbers: true
//            });
//            $('#J_save').on('click',function(){
//                editor.save();
//                sendFile($('#J_mirror').val(),false);
//            });
//            $('#J_saveAndBack').on('click',function(){
//                editor.save();
//                sendFile($('#J_mirror').val(),true);
//
//            });
//            $('#J_back').on('click',function(){
//                hideOrShow(true);
//                editor = null;
//                $('.CodeMirror').remove();
//            })
//		});
	}
//    editCode('test.py');
	function parsePath(p, newp){
		if(newp.startsWith('~')) newp = home + newp.slice(1);//cd ~/xxx or cd ~
		if(newp.startsWith('/')) return newp;//no else if becase newp may changed
		//rstrip '/'
		while(newp.endsWith('/')) newp = newp.slice(0, -1);
		//else
		console.log(newp+'---'+p);
		var s = newp.split('/');
		for(var t in s){
			t = s[t];
			if(t=='.' || t=='') continue;
			else if(t=='..') p=p.split('/').slice(0, -1).join('/');
			else p += ('/' + t);
		}
		if(p=='') p ='/';
		return p;
	}

	function appendToBox(n){
		var _ps1 = PS1.replace('USER', user).replace('DIR',realBasename(dir));
		var _box = $('#J_showBox');
		if(n){
			if(!n.endsWith('\n')) n += '<span style="color:black;background:white">%</span><br/>';
			_box.append(n.replace(/\n/g, "<br/>"));
		}
		_box.append('<b>'+_ps1+'</b>');
		_box.scrollTop(_box.prop('scrollHeight'));
	}
	//监听键盘事件
	$('#J_input').on('keydown',function(e){
		switch(e.keyCode){
			//回车键
			case 13:
				inputValue=$(this).val();
				$(this).val('');
				$('#J_showBox').append(path+inputValue+'<br>');
				if(valueArr.slice(-1)!=inputValue)   valueArr.push(inputValue);
				pointer = valueArr.length;
				//console.log(inputValue.startsWith('cd'));
				//将输入信息发送给服务器
                if(inputValue.startsWith('edit')){
                    editCode(inputValue.split(' ').pop());
                }else if (inputValue=='clear'){
                	location.reload();
                }else{

					if(inputValue.replace(' ', '') != ''){
						$.post(
							"/cmd/exec",
							{data:inputValue},
							function(response){
								//用户键入cd重新请求pwd
								if(inputValue.startsWith('cd')){
									if(!response.replace('\n','')){//no error
										//cd aa* is not supported
										dir = parsePath(dir, inputValue.split(' ').pop());
										//console.log(dir+','+response);
										//$('#J_showBox').append('<b>'+buildPS1()+'</b>');
										appendToBox();
									}else{
										appendToBox(response);
									}
								}else{
									appendToBox(response);
								}
							},
							function(jqXHR, textStatus, errorThrown){
								console.log('err');
								appendToBox('***An error occured.('+jqXHR.status+')***\n');
							});
					}else{
						appendToBox();
					}
					
                }
				break;

			//上键
			case 38:
				if(pointer>0){
					pointer--;
				}
				$(this).val(valueArr[pointer]);
				break;
			case 40:
				if (pointer<valueArr.length) {
					pointer++;
				}
				$(this).val(valueArr[pointer]);
				break;
		}
	})
});
