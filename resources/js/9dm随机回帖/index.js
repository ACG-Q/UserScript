/*
 * @Author: 六记
 * @Date: 2021-07-20 09:15:48
 * @LastEditTime: 2021-07-20 09:18:44
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: index.js
 */

var HTTPREGEX =
    /((http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&:/~\+#]*[\w\-\@?^=%&/~\+#])?)/i;
var xmlhttp;
if (window.XMLHttpRequest) {
    // code for IE7+, Firefox, Chrome, Opera, Safari
    xmlhttp = new XMLHttpRequest();
} else {
    // code for IE6, IE5
    xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
}

var app = new Vue({
    el: "#app",
    data: {
        defaultData: [
            "楼主@{author} 流弊~",
            "楼主, 为你点[b]赞[/b]",
            "感谢楼主分享",
            "66666666666666",
            "针不戳呀，写的针不戳！",
            "{hitokoto}",
            "看了LZ的帖子，我只想说一句很好很强大！",
            "啥也不说了，楼主就是给力！",
            "看帖看完了至少要顶一下",
            "哥顶的不是帖子，是寂寞！",
            "膜拜神贴，后面的请保持队形~",
            "果断MARK，前十有我必火！",
            "不错，又占了一个沙发！",
        ],
        tableData: [
            "楼主@{author} 流弊~",
            "楼主, 为你点[b]赞[/b]",
            "感谢楼主分享",
            "66666666666666",
            "针不戳呀，写的针不戳！",
            "{hitokoto}",
            "看了LZ的帖子，我只想说一句很好很强大！",
            "啥也不说了，楼主就是给力！",
            "看帖看完了至少要顶一下",
            "哥顶的不是帖子，是寂寞！",
            "膜拜神贴，后面的请保持队形~",
            "果断MARK，前十有我必火！",
            "不错，又占了一个沙发！",
        ],
        input: "",
        tmpData: [],
    },
    methods: {
        handleEdit(index, row) {
            this.$prompt("请输入新的评论", "评论编辑器", {
                inputValue: row,
                confirmButtonText: "确定",
                cancelButtonText: "取消",
            })
                .then(({ value }) => {
                    this.tmpData = this.tableData;
                    this.tmpData[index] = value;
                    this.tableData = [].concat(this.tmpData);
                    this.$message({
                        type: "success",
                        message: `${row}评论修改为: ${value}`,
                    });
                })
                .catch(() => {
                    this.$message({
                        type: "info",
                        message: "取消输入",
                    });
                });
        },
        handleDelete(index, row) {
            this.$confirm("此操作将永久删除该评论, 是否继续?", "提示", {
                confirmButtonText: "确定",
                cancelButtonText: "取消",
                type: "warning",
            })
                .then(() => {
                    this.tableData.splice(index, 1);
                    this.$message({
                        type: "success",
                        message: "删除成功!",
                    });
                })
                .catch(() => {
                    this.$message({
                        type: "info",
                        message: "已取消删除",
                    });
                });
        },
        goBack(index, row) {
            document.querySelector("#app").hidden = true;
            console.log("go back");
        },
        addMsg() {
            this.$prompt("请输入新的评论", "添加评论", {
                inputPlaceholder: "请输入新的评论",
                confirmButtonText: "确定",
                cancelButtonText: "取消",
            })
                .then(({ value }) => {
                    this.tableData.push(value);
                    this.$message({
                        type: "success",
                        message: "添加评论: " + value,
                    });
                })
                .catch(() => {
                    this.$message({
                        type: "info",
                        message: "取消输入",
                    });
                });
        },
        resetMsg() {
            this.$confirm("此操作将重置评论列表, 是否继续?", "提示", {
                confirmButtonText: "确定",
                cancelButtonText: "取消",
                type: "warning",
            })
                .then(() => {
                    this.tableData = this.defaultData;
                    this.$message({
                        type: "success",
                        message: "重置成功!",
                    });
                })
                .catch(() => {
                    this.$message({
                        type: "info",
                        message: "已取消重置",
                    });
                });
        },
    },
});
