<template>
<div>
    <div class="metas" :class="currentDoc._id == data.id ? 'chosen' : ''">
        <div>
            <div class="first">
                <!-- Thông tư -->
                {{data.metadata[2].value}}
                <div class="text-divider">
                    ·
                </div>
                <strong class="text-strong">
                    09/2021/TT-NHNN
                    <!-- {{data.signNumber}} -->
                </strong>
                <div class="text-divider">
                    ·
                </div>
                <!-- Ngân hàng Nhà nước Việt Nam -->
                {{data.metadata[1].value}}
            </div>
            
            
            <h1 class="title" >
                <!-- <el-dropdown>
  <img class="icon-bx-star" src="@/assets/icons-figma/bx-star-hover.svg" style="display: inline; margin-right: 10px;" alt="">
  <el-dropdown-menu class="test-dropdown-result-component-new-version-2" slot="dropdown">
    <h1 class="title-dropdown">lưu vào kho của bạn</h1>
    <el-checkbox-group v-model="checkedCities" @change="handleCheckedCitiesChange">
        <el-checkbox v-for="(item, index) in dataWorkspace" :label="item.id" :key="index + 'checkboxworkspace'">{{item.name}}</el-checkbox>
    </el-checkbox-group>
  </el-dropdown-menu>
</el-dropdown> -->




                <!-- <img class="icon-bx-star" src="@/assets/icons-figma/bx-star.svg" style="display: inline; margin-right: 10px;" alt=""> -->
                <!-- Sửa đổi, bổ sung một số điều của Thông tư số 42/2015... -->
                {{data.title}}
            </h1>
            <p v-if="tempTitleAfterHandle" class="content" v-html="tempTitleAfterHandle" @click="handleClickTitle($event)">
            <p v-else class="content" v-html="data.title" @click="handleClickTitle($event)">
                <!-- {{data.title}} -->
                <!-- Sửa đổi, bổ sung một số điều của Thông tư số 42/2015/TT-NHNN ngày 31 tháng
12 năm 2015 của Thống đốc Ngân hàng Nhà nước Việt Nam quy định về nghiệp vụ
thị trường mở -->
            </p>
            <div class="last">
                <!-- Nguyễn Thị Hồng -->
                {{data.metadata[0].value}}
                <div class="text-divider">
                    ·
                </div>
                cập nhật 10/04/2022
                <!-- cập nhật {{data.effectiveDateStr}} -->
            </div>
        </div>
    </div>
</div>
    
</template>
<script>
import {mapActions, mapState} from 'vuex'
export default {
    name: 'result-component',
    props: ["data"],
    methods: {
        ...mapActions('document', ['getDocById', 'getDocProps', 'setCurrentDoc']),
        ...mapActions('search', ['postFavorite', 'deleteFavorite']),
        ...mapActions('searchNewVersion', ['getDoc',
        'getDocsSimilarityGivenDocId']),
        ...mapActions('workspace', ['getAllDocsOfAllWorkspace', 'postDocToWorkspace', 'getWorkspace', 'deleteDocOfWorkspace']),
        handleResponse(response) {
            return response.text().then(text => {
                const data = text && JSON.parse(text);
                if (!response.ok) {
                    if (response.status === 401) {
                        // auto logout if 401 response returned from api
                        // logout();
                        // location.reload(true);
                        return
                    }

                    const error = (data && data.message) || response.statusText;
                    return Promise.reject(error);
                }
                return data;
            });
        },
        handleClickTitle(event) {
            console.log(this.data);
            // this.getDocById(this.data.docidx);
            this.setCurrentDoc(this.data);
            this.getDoc(this.data.id);
            this.getDocsSimilarityGivenDocId({size: 10, doc_id: this.data.id});
            this.$router.push({name: "detail"});
        },
        addFavorite(docidx) {
            let stringDocidx = docidx.toString()
            this.listFavorite.push(stringDocidx)
            this.postFavorite(stringDocidx)
        },
        removeFavorite(docidx) {
            let stringDocidx = docidx.toString()
            this.$confirm('Xác nhận bỏ đánh dấu tài liệu này?')
                .then(_ => {
                    // alert('yes')
                    let tempIndex = this.listFavorite.indexOf(stringDocidx);
                    this.listFavorite.splice(tempIndex, 1);
                    this.deleteFavorite(stringDocidx)
                })
                .catch(_ => {
                    // alert('no')
                });
        },
        handleUpdateBool(val) {
            console.log(val);
            console.log('retstt')
        },
        handleCheckedCitiesChange(value) {
            // console.log(value)
            // value.forEach(ele => {
            //     this.postDocToWorkspace({workspace_id: ele, doc_id: this.data.id})
            // })
            // if (this.checkedTrueFalse.length == 0) {
            //     value.forEach(ele => {
            //         this.postDocToWorkspace({workspace_id: ele, doc_id: this.data.id});
            //     })
            // }
            // else {
            //     this.checkedTrueFalse.forEach(ele => {
            //         if (this.value.includes(ele)) {
            //             this.postDocToWorkspace({workspace_id: ele, doc_id: this.data.id});
            //         }
            //         else {
            //             this.deleteDocToWorkspace({workspace_id: ele, doc_id: this.data.id});
            //         }
            //     })
            // }
            console.log(value)
            value.forEach(ele => {
                if (!this.checkedTrueFalse.includes(ele)) {
                    this.postDocToWorkspace({workspace_id: ele, doc_id: this.data.id});
                }
                else {
                    this.postDocToWorkspace({workspace_id: ele, doc_id: this.data.id});
                }
            })
            this.checkedTrueFalse.forEach(ele => {
                if (!value.includes(ele)) {
                    this.deleteDocOfWorkspace({workspace_id: ele, doc_id: this.data.id});
                }
            })

            // let checkedCount = value.length;
            // this.checkAll = checkedCount === this.cities.length;
            // this.isIndeterminate = checkedCount > 0 && checkedCount < this.cities.length;
        }
    },
    watch: {
        currentSearchSaved() {
            if (this.currentSearchSaved == "") {
                this.tempTitleAfterHandle = this.data.title;
            }
            
        },
        async tempListWordSegmentation() {
            let myTempList = []
            let myTempList2 = []
            if (this.tempListWordSegmentation.length > 0) {
                console.log(this.tempListWordSegmentation)
                await fetch(`https://nlp.yeu.ai/api/v1/tok?text=${this.data.title}`,{method: 'GET'
                }).then(this.handleResponse).then(response => {
                    // console.log(response.response)
                    myTempList = response.response});
                console.log(myTempList)



                myTempList.forEach(ele => {
                    this.tempListWordSegmentation.forEach(ele2 => {
                        if (ele[0] != "<") {
                            if (ele.toLowerCase().includes(ele2)) {
                                let tempIndex = myTempList.indexOf(ele)
                                myTempList[tempIndex] = `<em>${ele}</em>`
                            }
                        }
                        
                    })
                })
                this.tempTitleAfterHandle = myTempList.join(" ");
            }
        },
        data() {
            this.checkedCities = []
            this.checkedTrueFalse = []
            this.allDocsOfAllWorkspace.forEach((ele, index) => {
                ele.forEach(ele2 => {
                    if (ele2.id == this.data.id) {
                        this.checkedCities.push(this.dataWorkspace[index].id);
                        this.checkedTrueFalse.push(this.dataWorkspace[index].id);
                    }
                })
            })
            // console.log(this.data)
        },  
        // allDocsOfAllWorkspace() {
        //     this.checkedCities = [];
        //     this.checkedTrueFalse = [];
        //     this.allDocsOfAllWorkspace.forEach(ele => {
        //         ele.forEach(ele2 => {
        //             if (ele2.id == this.data.id) {
        //                 this.checkedCities.push(ele2.id);
        //                 this.checkedTrueFalse.push(ele2.id);
        //             }
        //         })
        //     })
        // }
        // workspaceStatus() {
        //     if (this.workspaceStatus == 'postDocToWorkspaceSuccess') {
        //         this.getWorkspace();
        //     }
        // }
    },
    computed: {
        ...mapState({
            currentDoc: state => state.document.currentDoc,
            listFavorite: state => state.search.listFavorite,


            dataWorkspace: state => state.workspace.workspace.data,
            allDocsOfAllWorkspace: state => state.workspace.allDocsOfAllWorkspace,
            workspaceStatus: state => state.workspace.status,

            tempListWordSegmentation: state => state.searchNewVersion.tempListWordSegmentation,
            currentSearchSaved: state => state.searchNewVersion.currentSearchSaved,

        }),
        checkBool() {
            this.allDocsOfAllWorkspace.forEach(ele => {
                // if (ele.includes(this.data.id)) {
                //     return true
                // }
                this.ele.forEach(ele2 => {
                    if (ele2.id == this.data.id) {
                        return true;
                    }
                })
            });
            return false;
        }
    },
    data() {
        return {
            testListCheckbox: [],
            checkedCities: [],
            checkedTrueFalse: [],
            tempTitleAfterHandle: '',
            
        }
    },
    async created() {



        let myTempList = []
        let myTempList2 = []
        if (this.tempListWordSegmentation.length > 0) {
            console.log(this.tempListWordSegmentation)
            await fetch(`https://nlp.yeu.ai/api/v1/tok?text=${this.data.title}`,{method: 'GET'
            }).then(this.handleResponse).then(response => {
                // console.log(response.response)
                myTempList = response.response});
            console.log(myTempList)



            myTempList.forEach(ele => {
                this.tempListWordSegmentation.forEach(ele2 => {
                    if (ele[0] != "<") {
                        if (ele.toLowerCase().includes(ele2)) {
                            let tempIndex = myTempList.indexOf(ele)
                            myTempList[tempIndex] = `<em>${ele}</em>`
                        }
                    }
                    
                })
            })
            this.tempTitleAfterHandle = myTempList.join(" ");
        }
        if (this.currentSearchSaved == "") {
            this.tempTitleAfterHandle = this.data.title
        }



        // console.log(this.allDocsOfAllWorkspace)
        // console.log(this.checkedTrueFalse);
        // console.log(this.checkedCities)
        
        // fetch("https://nlp.yeu.ai/api/v1/tok?text=Ngoài thương hiệu, giá cả, thời điểm mua hàng cũng là một yếu tố để có được sản phẩm tốt với giá rẻ.",{method: 'GET',
        // headers: { 'Content-Type': 'application/json' },
        // }).then(this.handleResponse).then(response => console.log(response));


        // if (this.tempListWordSegmentation.length > 0) {
        //     console.log(this.tempListWordSegmentation)
        //     fetch(`https://nlp.yeu.ai/api/v1/tok?text=${this.data.title}`,{method: 'GET'
        //     }).then(this.handleResponse).then(response => console.log(response.response));
        // }

        // let myTempList = []
        // let myTempList2 = []
        // if (this.tempListWordSegmentation.length > 0) {
        //     console.log(this.tempListWordSegmentation)
        //     await fetch(`https://nlp.yeu.ai/api/v1/tok?text=${this.data.title}`,{method: 'GET'
        //     }).then(this.handleResponse).then(response => {
        //         // console.log(response.response)
        //         myTempList = response.response});
        //     console.log(myTempList);
        //     // myTempList.forEach(ele => {
        //     //     if (this.tempListWordSegmentation.includes(ele.toLowerCase()))
        //     // })
        // }
        // setTimeout(function() {
        // console.log(this.tempListWordSegmentation)

        // }, 1000)

        this.checkedTrueFalse = [];
        this.checkedCities = [];
        console.log(this.data)
        console.log(this.dataWorkspace);
        console.log(this.allDocsOfAllWorkspace)
        let _this = this;
            setTimeout(function() {
                _this.allDocsOfAllWorkspace.forEach((ele, index) => {
                    ele.forEach(ele2 => {
                        if (ele2.id == _this.data.id) {
                            console.log('hereeee')
                            console.log(_this.dataWorkspace)
                            _this.checkedCities.push(_this.dataWorkspace[index].id);
                            _this.checkedTrueFalse.push(_this.dataWorkspace[index].id);
                        }
                    })
                })
                }, 500)
        // this.allDocsOfAllWorkspace.forEach((ele, index) => {
        //     ele.forEach(ele2 => {
        //         if (ele2.id == this.data.id) {
        //             this.checkedCities.push(this.dataWorkspace[index].id);
        //             this.checkedTrueFalse.push(this.dataWorkspace[index].id);
        //         }
        //     })
        // })
        // console.log(this.checkedTrueFalse);
        // console.log(this.checkedCities)
        // console.log('hello')


        
        // setTimeout(function() {console.log(_this.checkedCities)}, 1000)
        // setTimeout(function() {console.log(_this.checkedTrueFalse)}, 1000)
        // console.log(this.checkedTrueFalse)
    },
}
</script>
<style scoped>
.metas {
    padding: 12px 32px 12px 60px;
    cursor: pointer;
}
.metas:hover, .metas.chosen {
    background: #F8F0F0;
/* border-radius: 4px 0px 0px 4px; */
border-radius: 4px;
}
.first {
    font-family: 'Noto Sans';
font-style: normal;
font-weight: 400;
font-size: 13px;
line-height: 22px;
/* identical to box height, or 169% */

letter-spacing: -0.01em;

color: #272525;
}
.text-divider {
    height: 22px;
    width: 4px;
    font-family: 'Noto Sans';
font-style: normal;
font-weight: 400;
font-size: 13px;
line-height: 22px;
/* identical to box height, or 169% */


color: #272525;


/* Inside auto layout */

flex: none;
order: 1;
flex-grow: 0;
margin: 0px 4px;
display: inline-block;
}
.title {
    font-family: 'Noto Serif';
font-style: normal;
font-weight: 600;
font-size: 18px;
line-height: 130%;
/* or 23px */

letter-spacing: -0.01em;

color: #AF542D;
/* margin-left: -40px; */
overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 1;
    line-clamp: 1;
    -webkit-box-orient: vertical;
}
.content {
    font-family: 'Noto Sans';
font-style: normal;
font-weight: 400;
font-size: 14px;
line-height: 22px;
/* or 157% */

letter-spacing: -0.01em;

color: #504D4D;


/* Inside auto layout */

flex: none;
order: 2;
align-self: stretch;
flex-grow: 0;
margin: 4px 0px;
}
.last {
    font-family: 'Noto Sans';
font-style: normal;
font-weight: 400;
font-size: 13px;
line-height: 22px;
/* identical to box height, or 169% */

letter-spacing: -0.01em;

color: #272525;


/* Inside auto layout */

flex: none;
order: 2;
flex-grow: 0;
margin: 0px 8px;
margin-left: 0px;
}
.text-strong {
    font-family: 'Noto Sans';
font-style: normal;
font-weight: 700;
font-size: 13px;
line-height: 22px;
/* identical to box height, or 169% */

letter-spacing: -0.01em;

color: #272525;


/* Inside auto layout */

/* flex: none; */
/* order: 2; */
/* flex-grow: 0; */
/* margin: 0px 8px; */
}
</style>