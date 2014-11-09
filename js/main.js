$(function(){
	var inputValue,
		valueArr = [],
		path = '',path1='',path2='';
	//记录上下键的指针
	var pointer = valueArr.length;
    var editor;
    var dir;
    String.prototype.startWith=function(str){
        var reg=new RegExp("^"+str);
        return reg.test(this);
    }

    //初始化获得路径及用户名
	function getPath(){
		$.ajax({
            url:"/cmd/exec",
            type:'POST',
            data:'pwd',
            headers:{
                'X-PWD':dir
            },
            success:function(response){
                path1 = response.split('/').pop();
                if(response.startWith('/')){
                   dir = response;
                }else{
                    dir+=('/'+response);
                }
            }
        });
        $.ajax({
           url: "/cmd/exec",
           type:'POST',
           data:'whoami',
            headers:{
                'X-PWD':dir
            },
            success:function(response){
                path2 = response;
            }
        });

		path = path2+'@webshell:'+path1+'$ ';
	}

    //初始化
    getPath();
    $.post("/cmd/exec",{data:'echo ~'},function(response){
        var dir = response;
    });

	function editCode(filename){
        function sendFile(ctx,bol){
            $.post({
                url:'/cmd/savefile?',
                type:'POST',
                data:ctx,
                headers:{
                    'X-PWD':dir
                },
                success:function(res){
                    if(bol){
                        editor = null;
                        $('.CodeMirror').remove();
                        $('.button-group').hide();
                    }
                    alert('保存成功！');
                }
            });
        }
		$.ajax({
            url:'/cmd/readfile?'+filename,
            type:'GET',
            headers:{
                'X-PWD':dir
            },
            success:function(res){
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
            }
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
				console.log(inputValue.startWith('cd'));
				//将输入信息发送给服务器
                if(inputValue.startWith('edit')){
                    editCode(inputValue.split(' ').pop());
                }else{
                    $.ajax({
                        url:"/cmd/exec",
                        type:'POST',
                        data:inputValue,
                        headers:{
                            'X-PWD':dir
                        },
                        success:function(response){
                            //用户键入cd重新请求pwd
                            if(inputValue.startWith('cd')){
                                getPath();
                            }else{
                                $('#J_showBox').append(response);
                            }
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