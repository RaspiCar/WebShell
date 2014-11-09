
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
	var PS1 = 'USER@webshell:DIR $ ';
    String.prototype.startsWith=function(str){
        var reg=new RegExp("^"+str);
        return reg.test(this);
   	 }
	String.prototype.endsWith=function(str){
        var reg=new RegExp(str+"$");
        return reg.test(this);
   	 }
	$.post=function (e,r,i,s){return $.isFunction(r)&&(s=s||i,i=r,r=t),$.ajax({type:"POST",url:e,data:r,headers:{'X-PWD':dir},success:i,dataType:s})}
	$.get=function (e,r,i,s){return v.isFunction(r)&&(s=s||i,i=r,r=t),$.ajax({type:"GET",url:e,headers:{'X-PWD':dir},data:r,success:i,dataType:s})}

	function realBasename(p){
		if(p==home) return '~';
		else return p.split('/').pop();
	}

	function buildPS1(){
		return PS1.replace('USER', user).replace('DIR',realBasename(dir));
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
					$('#J_showBox').append(buildPS1());
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
            $.post(
                '/cmd/savefile?',
                {data:ctx},
                function(res){
                    if(bol){
                        editor = null;
                        $('.CodeMirror').remove();
                        $('.button-group').hide();
                    }
                    alert('保存成功！');
            });
        }
    	$.get(
       	 	'/cmd/readfile?',
        	{data:ctx},
        	function(res){
                console.log(res);
                $('#J_mirror').val(res);
                editor = CodeMirror.fromTextArea(document.getElementById("J_mirror"), {
                    mode: "python",
                    lineNumbers: true
                });
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
                    hideOrShow(true);
                    editor = null;
                    $('.CodeMirror').remove();
                    $('.button-group').hide();
                })
        });
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

	//监听键盘事件
	$('#J_input').on('keydown',function(e){
		switch(e.keyCode){
			//回车键
			case 13:
				inputValue=$(this).val();
				$(this).val('');
				$('#J_showBox').append(path+inputValue+'<br>');
				valueArr.push(inputValue);
				pointer = valueArr.length;
				console.log(inputValue.startsWith('cd'));
				//将输入信息发送给服务器
                if(inputValue.startsWith('edit')){
                    editCode(inputValue.split(' ').pop());
                }else{
                    $.post(
                        "/cmd/exec",
                        {data:inputValue},
                        function(response){
                            				//用户键入cd重新请求pwd
                            if(inputValue.startsWith('cd')){
								if(!response.replace('\n','')){//no error
                                	var new_dir = response.split(' ').pop();
									if(new_dir.startsWith('/')) dir = new_dir;
									else dir += ('/' + new_dir);
								}
                            }else{
                                $('#J_showBox').append(response.replace('\n','<br>')+'<br>'+buildPS1());
                            }
                    });
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
