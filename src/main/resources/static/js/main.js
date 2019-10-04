let accessToken = "";
let accessTokenIsValid = false;
let jiraUrl = "";
miro.onReady(() => {
    miro.initialize({
        extensionPoints: {
            bottomBar: {
                title: 'Jira2Miro integration by kaszaq',
                svgIcon: '<circle cx="12" cy="12" r="9" fill="purple" />  <g transform=" matrix(0.866, -0.5, 0.25, 0.433, 12, 12)">    <path d="M 0,10.5 A 9.75,10.5 0 0,0 9.75,0 5,5 0 0,1 14.2,0 11.2,10.5 0 0,1 0,10.5Z" fill="yellow">      <animateTransform attributeName="transform" type="rotate" from="360 0 0" to="0 0 0" dur="1s" repeatCount="indefinite" />    </path>  </g>  <path fill="purple" d="M 9,0 A 7.5,7.5 0 0,0 -9,0Z" transform="matrix(0.866, -0.5, 0.5, 0.866, 12, 12)" />',

                onClick: requestAuthentication
            },
        }
    });
    //https://api.atlassian.com/ex/jira/{cloudid}/
    getSharedConfiguration(miroClientId).then((config)=> jiraUrl = 'https://api.atlassian.com/ex/jira/'+config.jiraCloudId);
    setTimeout(updateStatus, 0);
});

let bottomPanelOpen = false;
function requestAuthentication() {
    if(!bottomPanelOpen){
        bottomPanelOpen= true;
        miro.board.ui.openBottomPanel(loginUrl, {width:280}).then(function (data) {
            bottomPanelOpen=false;
            setTimeout(updateStatus, 0);
        }).catch(reason => {
            setTimeout(updateStatus, 0);
        });
    }
}

function updateStatus() { // TODO: all this stuff regarding checking the session and access token has to be rewritten...
    $.get("/getAccessToken", function (data) {
        if (data == "" || !accessTokenIsValid) {
            if(data != "" && !accessTokenIsValid && !bottomPanelOpen) {
                getSharedConfiguration(miroClientId)
                    .then((config)=>{
                        $.get({
                            url: "https://api.atlassian.com/oauth/token/accessible-resources",
                            headers: {"Authorization": "Bearer " + data},
                        }).then((accessibleResources)=>{
                            for (let i = 0; i < accessibleResources.length; i++) {
                                if (config.jiraCloudId == accessibleResources[i].id) {
                                    accessTokenIsValid = true;
                                    accessToken=data;
                                    break;
                                }
                            }
                            if (data == "" || !accessTokenIsValid) {
                                requestAuthentication();
                            }
                        }).catch(reason => {
                            requestAuthentication();
                        })

                    })
            } else {
                    requestAuthentication();
            }

        } else {
            setTimeout(updateStatus, 10000);
        }
    });
}