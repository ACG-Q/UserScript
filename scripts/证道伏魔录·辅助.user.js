// ==UserScript==
// @name         证道伏魔录·辅助
// @namespace    Violentmonkey Scripts
// @match        https://fml.alangge.com/*
// @grant        none
// @version      1.1
// @author       六记
// @description  证道伏魔录游戏辅助功能增强，支持一键操作等自动化脚本
// ==/UserScript==

(() => {
  const wait = (milliseconds) => {
    return new Promise((resolve) => {
      setTimeout(resolve, milliseconds);
    });
  };

  // 一键关闭秘境
  const addOneCloseButton = () => {
    //判断是否在“外事堂”
    let title = document.querySelector(".button_tz_post.nav-hover");
    let buttonGroup = document.querySelector(
      "#ajaxHtmlShow > div:nth-child(4) > div > div.col-md-12.col-xs-12 > div:nth-child(4)",
    );
    if (
      title &&
      title.innerText === "外事堂" &&
      !document.querySelector("#sp_for")
    ) {
      // 如果存在说明是在秘境中
      if (buttonGroup) {
        return false;
      }
      const toolbar = document.querySelectorAll(".body_sm>div>div")[3];
      // 添加 一键关闭(非VIP)
      // <input type="button" class="button3 button_submit" url="menu=dfws" name="onekeyclosesecret" value="一键关闭">
      const button = document.createElement("input");
      button.type = "button";
      button.classList = "button3 button_submit";
      button.value = "一键关闭(非VIP)";
      button.id = "sp_for";
      button.onclick = () => {
        // eslint-disable-next-line no-restricted-globals
        if (confirm("您确定要进行一键关闭吗？")) {
          document
            .querySelectorAll(".text-nowrap")[1]
            .querySelectorAll(".button9")
            .forEach((e) => e.click());
          window.location.reload();
        }
      };

      toolbar.appendChild(button);

      return true;
    }
    return false;
  };

  // 一键签到 & 领取VIP等级福利 & 无尽深渊
  const addOneSignButton = () => {
    const getWj = () => {
      return new Promise((resolve, reject) => {
        let url = "/index.php?Wjsy";
        let params = new URLSearchParams();
        params.append("ajaxBattle", "1");
        params.append("Wjsy_lq", "每日签到");
        fetch(url, {
          method: "POST", // 设置请求方法为POST
          body: params, // 设置请求体为转换后的JSON字符串
        })
          .then(() => {
            console.log("无尽深渊领取成功");
            resolve();
          })
          .catch((error) => {
            console.error("Error:", error);
            reject();
          }); // 打印任何错误
      });
    };

    const getSign = () => {
      return new Promise((resolve, reject) => {
        let signUrl = "/index.php?settingfl";
        let signParams = new URLSearchParams();
        signParams.append("ajaxBattle", "1");
        signParams.append("qiandao", "每日签到");
        fetch(signUrl, {
          method: "POST", // 设置请求方法为POST
          body: signParams, // 设置请求体为转换后的JSON字符串
        })
          .then(() => {
            console.log("签到指令运行成功");
            resolve();
          })
          .catch((error) => {
            console.error("Error:", error);
            reject();
          }); // 打印任何错误
      });
    };

    const getVip = () => {
      return new Promise((resolve, reject) => {
        let vipUrl = "/index.php?settingvip";
        let vipParms = new URLSearchParams();
        vipParms.append("ajaxBattle", "1");
        vipParms.append("vip_gomod3", "领每日福利");
        fetch(vipUrl, {
          method: "POST", // 设置请求方法为POST
          body: vipParms, // 设置请求体为转换后的JSON字符串
        })
          .then(() => {
            console.log("领取指令运行成功");
            resolve();
          })
          .catch((error) => {
            console.error("Error:", error);
            reject();
          }); // 打印任何错误
      });
    };

    const menuElement = document.querySelector(
      "#ajaxHtmlShow > .body_md.pbgb  div.row > div:nth-child(4) > div",
    );
    if (menuElement && !document.querySelector("#sign")) {
      const buttonElement = document.createElement("input");
      buttonElement.type = "button";
      buttonElement.className = "button6";
      buttonElement.style = "border-radius:5px;";
      buttonElement.value = "一键领取";
      buttonElement.id = "sign";
      buttonElement.onclick = () => {
        Promise.all([getVip(), getSign(), getWj()])
          .then(() => {
            alert("签到成功 & 领VIP每日福利成功");
          })
          .catch(() => {
            alert("一键领取 执行失败");
          });
      };
      menuElement.appendChild(buttonElement);
    }
  };

  // 批量扫荡秘境
  const addBatchCleanBtn = () => {
    const batchCleanFun = (index) => {
      return new Promise((resolve, reject) => {
        let url = "/index.php?Active";
        let params = new FormData();
        params.append(`monster_battle_fb_a_${index + 1}`, "全部扫荡");
        params.append("ajaxBattle", 1);
        fetch(url, {
          method: "POST",
          // headers: {
          //     "Content-Type": "application/x-www-form-urlencoded"
          // },
          body: params,
        })
          .then(() => {
            console.log(`每日第${index + 1}个秘境完成`);
            resolve();
          })
          .catch(() => {
            console.log(`每日第${index + 1}个秘境失败`);
            reject();
          });
      });
    };

    let title = document.querySelector("#ajaxHtmlShow  h4:nth-child(1)");
    if (
      title &&
      title.innerText.includes("天地棋局") &&
      !document.querySelector("#batchClean")
    ) {
      let button = document.createElement("button");
      button.className = "button3";
      button.type = "button";
      button.innerText = "批量快速扫荡";
      button.id = "batchClean";

      button.onclick = () => {
        Promise.all([0, 1, 2, 3, 4, 5, 6].map((i) => batchCleanFun(i)))
          .then(() => {
            alert("批量扫荡执行成功");
          })
          .catch(() => {
            alert("批量扫荡执行失败");
          });
      };

      title.appendChild(button);
    }
  };

  // 一键升级伙伴等级
  const addUpAllByPartner = () => {
    const upByPartner = (team, name) => {
      return new Promise((resolve, reject) => {
        let url = "/index.php?" + team;
        let params = new FormData();
        params.append(`levelcharup`, "一键升级");
        params.append("ajaxBattle", 1);
        fetch(url, {
          method: "POST",
          // headers: {
          //     "Content-Type": "application/x-www-form-urlencoded"
          // },
          body: params,
        })
          .then(() => {
            console.log(`${name} 一键升级成功`);
            resolve();
          })
          .catch((e) => {
            console.log(`${name} 一键升级失败: ${e}`);
            reject();
          });
      });
    };

    let title = document.querySelector(
      "#ajaxHtmlShow > div.body_md.pbgb > div > h4",
    );
    let partners = document.querySelectorAll(".button_tz_get");
    let buttonGroup = document.querySelector(
      "#ajaxHtmlShow div > div.col-md-12.col-xs-12 > div:nth-child(2)",
    );
    if (
      title &&
      title.innerText.includes("伙伴列表") &&
      partners.length > 0 &&
      !document.querySelector("#upByPartner")
    ) {
      let button = document.createElement("input");
      button.className = "button6";
      button.type = "button";
      button.value = "一键升级";
      button.id = "upByPartner";

      button.onclick = () => {
        Promise.all(
          Array.from(partners).map((partner) =>
            upByPartner(
              partner.name,
              partner.parentNode.parentNode.innerText.replace(/\n/, " "),
            ),
          ),
        )
          .then(() => alert("一键所有伙伴升级执行成功"))
          .catch(() => alert("一键所有伙伴升级执行失败"));
      };

      buttonGroup.appendChild(button);
    }
  };

  // 一键入队(天魔入侵)
  const addJoinToKill = () => {
    // 获取团队ID
    const getTeamId = (teamIndex) => {
      console.log("teamIndex", teamIndex);
      const regex = new RegExp('name="teamid"\\svalue="(\\d+)"', "gm");
      const decoder = new TextDecoder("gbk");
      return new Promise((resolve, reject) => {
        // https://fml.alangge.com/index.php?Raidboss
        let url = "/index.php?Raidboss";
        let params = new FormData();
        params.append("raidboss_team", teamIndex);
        params.append("ajaxBattle", 1);
        fetch(url, {
          method: "POST",
          // headers: {
          //     "Content-Type": "application/x-www-form-urlencoded"
          // },
          body: params,
        })
          .then((response) => {
            // 获取 reader
            const reader = response.body.getReader();

            // 读取数据
            return new Promise((resolve, reject) => {
              let texs = [];
              try {
                reader.read().then(function process({ done, value }) {
                  if (done) {
                    console.log("Stream finished");
                    return resolve(texs.join(""));
                  }

                  let text = decoder.decode(value);
                  texs.push(text);
                  // console.log('Received data chunk', text);

                  // 读取下一段数据
                  return reader.read().then(process);
                });
              } catch (e) {
                reject(e);
              }
            });
          })
          .then((data) => {
            let result = regex.exec(data);
            if (result) {
              console.log("teamIndex", teamIndex, result[1]);
              resolve(result[1]);
            } else {
              reject();
            }
          })
          .catch(() => {
            reject();
          });
      });
    };

    const join = (teamid) => {
      return new Promise((resolve, reject) => {
        let url = "/index.php?Raidboss";
        let params = new FormData();
        params.append(`teamid`, teamid);
        params.append("jointeam", "入队");
        fetch(url, {
          method: "POST",
          // headers: {
          //     "Content-Type": "application/x-www-form-urlencoded"
          // },
          body: params,
        })
          .then(() => {
            console.log(`加入 ${teamid} 成功`);
            resolve();
          })
          .catch((e) => {
            console.log(`加入 ${teamid} 失败: ${e}`);
            reject();
          });
      });
    };

    const title = document.querySelector(
      "#ajaxHtmlShow > div.body_md.pbgb > div > div.col-md-12.col-xs-12 > h4.panel-title.col-md-12.col-xs-12",
    );
    if (
      title &&
      title.innerText.includes("天魔入侵") &&
      !document.querySelector("#joinToKill")
    ) {
      let button = document.createElement("input");
      button.className = "button6";
      button.type = "button";
      button.value = "一键入队";
      button.id = "joinToKill";

      button.onclick = () => {
        // 请输入4个团队序号
        let teamIndexs = prompt("请输入4个团队序号(25 26 27 28)").split(" ");
        // prompt("请输入4个团队序号").split(" ").forEach((i)=>console.log(i))
        Promise.all(
          teamIndexs.map((i) => getTeamId(i).then((teamid) => join(teamid))),
        )
          .then(() => alert("一键入队执行成功"))
          .catch(() => alert("一键入队执行失败"));
      };

      title.appendChild(button);
    }
  };

  // 冥河鬼舫
  const addJoinGuifang = () => {
    const join = () => {
      return new Promise((resolve, reject) => {
        let url = "/index.php?Worldboss";
        let parms = new URLSearchParams();
        parms.append("ajaxBattle", "1");
        parms.append("signup", "报名参加");
        fetch(url, {
          method: "POST", // 设置请求方法为POST
          body: parms, // 设置请求体为转换后的JSON字符串
        })
          .then(() => {
            console.log("报名成功");
            resolve();
          })
          .catch((error) => {
            console.error("Error:", error);
            reject();
          }); // 打印任何错误
      });
    };

    const menuElement = document.querySelector(
      "#ajaxHtmlShow > .body_md.pbgb  div.row > div:nth-child(4) > div",
    );
    if (menuElement && !document.querySelector("#joinGuifang")) {
      const buttonElement = document.createElement("input");
      buttonElement.type = "button";
      buttonElement.className = "button6";
      buttonElement.style = "border-radius:5px;";
      buttonElement.value = "一键报名";
      buttonElement.id = "joinGuifang";
      buttonElement.onclick = () => {
        Promise.all([join()])
          .then(() => {
            alert("报名成功");
          })
          .catch(() => {
            alert("报名失败");
          });
      };
      menuElement.appendChild(buttonElement);
    }
  };

  // 一键开垦药田
  const addOneClickCultivate = () => {
    const cultivate = (count) => {
      return new Promise((resolve, reject) => {
        const url = "/index.php?menu=dfbcy";
        const params = new URLSearchParams();
        params.append("xzkw", "1");
        params.append("ajaxBattle", "1");
        fetch(url, {
          method: "POST",
          body: params,
        })
          .then(() => {
            console.log(`成功开垦第${count}块土地`);
            resolve();
          })
          .catch((error) => {
            console.error("Error:", error);
            reject();
          });
      });
    };

    const menuElement = document.querySelector(
      "#ajaxHtmlShow > div.body_md.pbgb > div > div > div.col-md-12.col-xs-12",
    );
    const titleElement = document.querySelector(
      "#ajaxHtmlShow > div.body_md.pbgb > div > div > h4:nth-child(1)",
    );

    if (
      titleElement &&
      titleElement.innerText.includes("灵植仓库") &&
      menuElement &&
      !document.querySelector("#oneClickCultivate")
    ) {
      const buttonElement = document.createElement("input");
      buttonElement.type = "button";
      buttonElement.className = "button3 submit";
      buttonElement.value = "一键开垦";
      buttonElement.id = "oneClickCultivate";
      buttonElement.onclick = () => {
        const count = prompt("请输入要开垦的土地数量");
        if (count) {
          for (let i = 1; i <= count; i++) {
            cultivate(i);
          }
          alert("开垦命令执行完成");
        }
      };
      menuElement.insertBefore(buttonElement, menuElement.firstChild);
    }
  };

  // 一键升级药田
  const addUpgradeFarmland = () => {
    const upgradeFarmland = () => {
      return new Promise((resolve, reject) => {
        const url = "/index.php?menu=dfbcy";
        const params = new URLSearchParams();
        params.append("ytsj", "1");
        params.append("ajaxBattle", "1");
        fetch(url, {
          method: "POST",
          body: params,
        })
          .then(() => {
            console.log("药田升级成功");
            resolve();
          })
          .catch((error) => {
            console.error("Error:", error);
            reject();
          });
      });
    };

    const menuElement = document.querySelector(
      "#ajaxHtmlShow > div.body_md.pbgb > div > div > div.col-md-12.col-xs-12",
    );
    const titleElement = document.querySelector(
      "#ajaxHtmlShow > div.body_md.pbgb > div > div > h4:nth-child(1)",
    );

    if (
      titleElement &&
      titleElement.innerText.includes("灵植仓库") &&
      menuElement &&
      !document.querySelector("#oneClickUpgrade")
    ) {
      const buttonElement = document.createElement("input");
      buttonElement.type = "button";
      buttonElement.className = "button3 submit";
      buttonElement.value = "一键升级药田";
      buttonElement.id = "oneClickUpgrade";
      buttonElement.onclick = () => {
        const count = prompt("请输入要升级次数");
        if (count) {
          for (let i = 1; i <= count; i++) {
            upgradeFarmland();
          }
          alert("药田升级命令执行完成");
        }
      };
      menuElement.insertBefore(buttonElement, menuElement.firstChild);
    }
  };

  const addRefineEquipmentButton = () => {
    const refineEquipment = (opt, j) => {
      if (j === undefined) j = 0;
      let i = opt.maxLen;
      let element = opt.element;

      return new Promise((resolve, reject) => {
        console.log(i, j);
        if (j >= i) {
          console.log("强化指令执行结束");
          return resolve();
        }
        const url = "/index.php?refine=1695440709893474";
        const params = new URLSearchParams();
        params.append("onekeyrefine", "1");
        params.append("ajaxBattle", "1");
        fetch(url, {
          method: "POST",
          body: params,
        })
          .then(() => {
            console.log("强化成功");
            opt.success += 1;
            element.value = `已强化${j + 1}次[${opt.success}/${opt.fail}]`;
            if (j % opt.waitDetermine === 0) {
              opt.waitFun(opt.waitTime).then(() => {
                return resolve(refineEquipment(opt, j + 1)); // 返回一个Promise对象
              });
            } else {
              return resolve(refineEquipment(opt, j + 1)); // 返回一个Promise对象
            }
          })
          .catch((error) => {
            console.error("Error:", error);
            opt.fail += 1;
            element.value = `已强化${j + 1}次[${opt.success}/${opt.fail}]`;

            if (j % opt.waitDetermine === 0) {
              opt.waitFun(opt.waitTime).then(() => {
                return reject(refineEquipment(opt, j + 1)); // 返回一个Promise对象
              });
            } else {
              return reject(refineEquipment(opt, j + 1)); // 返回一个Promise对象
            }
          });
      });
    };
    const targetElement = document.querySelector(
      "#ajaxHtmlShow > div.body_md.pbgb > div > div.col-md-12.col-xs-12.lazydiv",
    );
    const h4Element = document.querySelector(
      "#ajaxHtmlShow > div.body_md.pbgb > div > div.col-md-12.col-xs-12.lazydiv > h4",
    );

    if (
      h4Element &&
      h4Element.innerText.includes("装备强化") &&
      !document.querySelector("#oneClickRefine")
    ) {
      const buttonElement = document.createElement("input");
      buttonElement.type = "button";
      buttonElement.className = "button4";
      buttonElement.value = "一键强化pro";
      buttonElement.style.marginTop = "10px";
      buttonElement.id = "oneClickRefine";
      buttonElement.style.width = "unset";
      buttonElement.style.padding = "0 10px";
      buttonElement.onclick = () => {
        const count = prompt("请输入要强化次数");
        if (count && !isNaN(Number(count))) {
          const opt = {
            element: buttonElement,
            maxLen: Number(count),
            success: 0,
            fail: 0,
            waitFun: wait,
            waitDetermine: 30,
            waitTime: 2000,
          };
          refineEquipment(opt)
            .then(() => {
              buttonElement.value = "一键强化pro【完成】";
            })
            .catch(() => {
              alert("强化指令运行失败");
            });
        }
      };
      targetElement.appendChild(buttonElement);
    }
  };

  setInterval(() => {
    addOneCloseButton();
    addOneSignButton();
    addBatchCleanBtn();
    addUpAllByPartner();
    addJoinToKill();
    addJoinGuifang();
    // addOneClickCultivate() // 已经开垦完了
    // addUpgradeFarmland() // 已经升级到100了
    addRefineEquipmentButton();
  }, 1000);
})();
