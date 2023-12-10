<?php
/**
 * Created by PhpStorm.
 * User: ussaidiqbal
 * Date: 2021-06-21
 * Time: 11:20
 */
include "../includes/parse-config.php";
use Parse\ParseQuery;
use Parse\ParseUser;
use Parse\ParseFile;
use Parse\ParseObject;
$response = array();
$response["success"] = 0;
$response["message"] = "";

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');

if(isset($_POST["PROVIDER"]) && isset($_POST["PHONE"]) && isset($_POST["ID"])){
    if($_POST["PROVIDER"] == "PHONE"){
        $query = new ParseQuery("_User");
        $query->equalTo("phoneNumber", $_POST["PHONE"]);
        $isUser = $query->first();
        if($isUser != null){
            try{
                $LoggedInUser = ParseUser::logIn($isUser->get("username"), $_POST["ID"]);
                $response["message"] = "Old Account!";
                $response["success"] = 1;
				$response["userId"] = $LoggedInUser->getObjectId();
            }catch (Exception $ex){
                $response["message"] = $ex->getMessage();
            }
        }else{
            $user = new ParseUser();
            $username = "user".generateRandomNumber(10);
            $user->set("username", $username);
            $user->set("password", $_POST["ID"]);
            $user->set("email", $username."@fablefrog.com");
            $user->set("phoneNumber", $_POST["PHONE"]);
            try {
                $user->signUp();
                $LoggedInUser = ParseUser::logIn($user->get("username"), $_POST["ID"]);
                $response["success"] = 1;
				$response["userId"] = $LoggedInUser->getObjectId();
                // Hooray! Let them use the app now.
            } catch (ParseException $ex) {
                // Show the error message somewhere and let the user try again.
                $response["message"] = "Error: " . $ex->getCode() . " " . $ex->getMessage();
            }
        }
    }
}
else if(isset($_POST["PROVIDER"]) && isset($_POST["EMAIL"])&& isset($_POST["FULL-NAME"]) && isset($_POST["ID"])){
    if($_POST["PROVIDER"] == "GOOGLE"){
        $query = new ParseQuery("_User");
        $query->equalTo("email", $_POST["EMAIL"]);
        $isUser = $query->first();
        if($isUser != null){
            try{
                //$LoggedInUser = ParseUser::logIn($isUser->get("username"), $_POST["ID"]);
                $response["message"] = "Old Account!";
                $response["success"] = 1;
				$response["userId"] = $isUser->getObjectId();
            }catch (Exception $ex){
                $response["message"] = $ex->getMessage();
            }
        }else{
            $user = new ParseUser();
            $user->set("username", "user".generateRandomNumber(10));
            $user->set("password", $_POST["ID"]);
            $user->set("email", $_POST["EMAIL"]);
            try {
                $user->signUp();
                $LoggedInUser = ParseUser::logIn($user->get("username"), $_POST["ID"]);
                $response["success"] = 1;
				$response["userId"] = $LoggedInUser->getObjectId();
                // Hooray! Let them use the app now.
            } catch (ParseException $ex) {
                // Show the error message somewhere and let the user try again.
                $response["message"] = "Error: " . $ex->getCode() . " " . $ex->getMessage();
            }

            //$response["message"] = "New Account!";
        }
    }
}
else if(isset($_POST["WHICH"])){
    $response["message"] = "Kindly login to continue";
	$query = new ParseQuery("_User");
	$query->equalTo("objectId", $_POST["ID"]);
	$LoggedInUser = $query->first();

    if($LoggedInUser != null){

         switch ($_POST["WHICH"]){
             case "TRACK-USER":
                 if(isset($_POST["USER"])){
                     $query= new \Parse\ParseQuery("Followings");
                     $query->equalTo("Follower", $LoggedInUser);
                     $query->equalTo("Followed", ParseObject::create("_User", $_POST["USER"], true));
                     $FollowObject = $query->first();
                     if($FollowObject == null){
                         //Not Following
                         $response["isSubscribed"] = true;
                         $FollowObject = new ParseObject("Followings");
                         $FollowObject->set("Follower", $LoggedInUser);
                         $FollowObject->set("Followed", ParseObject::create("_User", $_POST["USER"], true));
                         $FollowObject->save();
                     }else{
                         //Already Following
                         $response["isSubscribed"] = false;
                         $FollowObject->destroy();
                     }
                     $response["success"] = 1;
                     //
                 }
                 break;
             case "SUBSCRIBE-TOPIC":
                 if(isset($_POST["TOPIC"])){
					 if ($_POST["ISSUBTOPIC"] == "true")
						$query = new \Parse\ParseQuery("BuzzSubTopics");
					 else
						$query = new \Parse\ParseQuery("BuzzTopics");
                     $query->equalTo("objectId", $_POST["TOPIC"]);
                     $Topic = $query->first(true);
                     if($Topic != null){
                         $FollowedBy = $Topic->get("FollowedBy");
                         if($FollowedBy == null){
                             $FollowedBy = array();
                         }
                         if(in_array($LoggedInUser->getObjectId(), $FollowedBy)){
                             //Remove Subscription
                             $FollowedBy = array_diff($FollowedBy, array($LoggedInUser->getObjectId()));
                             $response["isSubscribed"] = false;
                         }else{
                             //Add To Subscribed
                             $response["isSubscribed"] = true;
                             array_push($FollowedBy, $LoggedInUser->getObjectId());
                         }
                         $response["Subscribers"] = number_shorten(sizeof($FollowedBy), 2);
                         $Topic->setArray("FollowedBy", $FollowedBy);
                         $Topic->save();
                         $response["success"] = 1;
                     }else{
                         $response["message"] = "Unknown topic";
                     }
                     //
                 }
                 break;
             case "UPDATE-PROFILE":
                 if(isset($_POST["userName"])){
                     $LoggedInUser->set("username", $_POST["userName"]);
                     $LoggedInUser->set("fullName", $_POST["fullName"]);
                     $LoggedInUser->set("userBio", $_POST["userBio"]);
                     $LoggedInUser->set("fbLink", $_POST["fbLink"]);
                     $LoggedInUser->set("twitterLink", $_POST["twitterLink"]);
                     $LoggedInUser->set("instaLink", $_POST["instaLink"]);
                     $LoggedInUser->set("linkedinLink", $_POST["linkedinLink"]);
                     $LoggedInUser->save(true);
                     $response["success"] = 1;
                     $response["message"] = "Profile updated successfully!";
                 }
                 break;
             case "UPLOAD-COVER":
                 if(!empty($_FILES["UserCover"]["name"])){
                     $ext2 = pathinfo($_FILES['UserCover']['name'], PATHINFO_EXTENSION);
                     $d1 = new Datetime();
                     $FileName  = $d1->format('U')."_cover.".$ext2;
                     if(move_uploaded_file($_FILES['UserCover']['tmp_name'], 'TempData/' . $FileName)){
                         $CoverFile = ParseFile::createFromFile('TempData/' . $FileName, "cover.".$ext2);
                         $CoverFile->save();
                         $LoggedInUser->set("CoverImage", $CoverFile);
                         unlink("TempData/".$FileName);
                         unset($image);
                     }
                     $LoggedInUser->save(true);
                     $response["success"] = 1;
                     $response["message"] = "Cover photo has been changed.";
                 }
                 break;
             case "UPLOAD-PROFILE":
                 if(!empty($_FILES["ProfileImage"]["name"])){
                     $ext2 = pathinfo($_FILES['ProfileImage']['name'], PATHINFO_EXTENSION);
                     $d1 = new Datetime();
                     $FileName  = $d1->format('U')."_avatar.".$ext2;
                     if(move_uploaded_file($_FILES['ProfileImage']['tmp_name'], 'TempData/' . $FileName)){
                         $CoverFile = ParseFile::createFromFile('TempData/' . $FileName, "avatar.".$ext2);
                         $CoverFile->save();
                         $LoggedInUser->set("avatar", $CoverFile->getURL());
                         unlink("TempData/".$FileName);
                         unset($image);
                     }
                     $LoggedInUser->save(true);
                     $response["success"] = 1;
                     $response["message"] = "Profile picture has been changed.";
                 }
                 break;
			case "PROFILE":
				$response["id"] = $LoggedInUser->getObjectId();
				$response["avatar"] = GetAvatar($LoggedInUser);
				$CoverImage = $LoggedInUser->get("CoverImage");
				$response["CoverImage"] = $CoverImage == null ? "/dummy_cover.png" : $CoverImage->getURL();
				$response["username"] = $LoggedInUser->get("username");
				$response["fullName"] = $LoggedInUser->get("fullName");
				$response["userBio"] = $LoggedInUser->get("userBio");
				$response["fbLink"] = $LoggedInUser->get("fbLink");
				$response["twitterLink"] = $LoggedInUser->get("twitterLink");
				$response["instaLink"] = $LoggedInUser->get("instaLink");
				$response["linkedinLink"] = $LoggedInUser->get("linkedinLink");
				$introFile = $LoggedInUser->get("introFile");
				$response["introFile"] = $introFile == null ? null : $introFile->getURL();
				
				$query= new ParseQuery("Followings");
				$query->equalTo("Followed", $LoggedInUser);
				$response["trackedBy"] = $query->count();
				
				$response["following"] = false;
				if(isset($_POST["USER"])){
					$query = new ParseQuery("_User");
					$query->equalTo("objectId", $_POST["USER"]);
					$User = $query->first();
					if ($User != null) {
						$query= new ParseQuery("Followings");
						$query->equalTo("Follower", $User);
						$query->equalTo("Followed", $LoggedInUser);
						$response["following"] = $query->count() > 0;
					}
				}
				break;
			case "HISTORY":
				$response["createdAt"] = $LoggedInUser->getCreatedAt()->format("F Y");
				$query = new Parse\ParseQuery("Buzz");
                $query->includeKey("userPointer");
                $query->containedIn("likedBy", array($LoggedInUser->getObjectId()));
                $query->notContainedIn("blockedBy", array($LoggedInUser->getObjectId()));
                $query->notContainedIn("reportedBy", array($LoggedInUser->getObjectId()));
                $query->limit(7);
                $stories = $query->find();
				$response["stories"] = array();
				$response["success"] = 1;
                foreach ($stories as $story){
					$User = $story->get("userPointer");
					$following = false;
					if ($LoggedInUser != null) {
						$query2 = new \Parse\ParseQuery("Followings");
						$query2->equalTo("Follower", $LoggedInUser);
						$query2->equalTo("Followed", ParseObject::create("_User", $User->getObjectId(), true));
						$FollowObject = $query2->first();
						if($FollowObject != null)
							$following = true;
					}
					$value = array();
					$value["id"] = $story->getObjectId();
					$value["author"] = $User->get("username");
					$value["authorId"] = $User->getObjectId();
					$value["following"] = $following;
					$value["title"] = $story->get("postBody");
					$value["voice"] = $story->get("voice");
					$value["reply"] = $story->get("commentsCount");
					$value["view"] = $story->get("playedByCount");
					$value["photo"] = $story->get("coverImage")->getURL();
					$value["audioFile"] = $story->get("audioFile")->getURL();
					array_push($response["stories"], $value);
                }
				break;
			case "USER-ACTIVITY":
				$query = new ParseQuery("Notifications");
				$query->includeKey("otherUser");
				$query->equalTo("currUser", $LoggedInUser);
				$query->includeKey("FablePointer");
				$query->limit(2000);
				$query->descending("createdAt");
				$stories = $query->find();
				$response["stories"] = array();
				$response["success"] = 1;
				foreach ($stories as $story){
					$Fable = $story->get("FablePointer");
					$value = array();
					$value["time"] = get_time_ago($story->getCreatedAt());
					$value["photo"] = GetAvatar($story->get("otherUser"));
					$value["description"] = $story->get("text");
					$value["fable"] = $Fable == null ? null : $Fable->getObjectId();
					array_push($response["stories"], $value);
                }
				break;
         }
    }

}else if(isset($_POST["LOGOUT"])){
    if (session_status() == PHP_SESSION_NONE) {
        session_start();
    }
    try{
        session_destroy();
        $response = array();
        $response["success"] = 1;
    }catch (Exception $exception){
        $response["success"] = 0;
        $response["message"] = $exception;
    }

}
echo json_encode($response);
?>