import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from "@apollo/client";
import { CombinedGraphQLErrors } from "@apollo/client/errors";
import { ErrorLink } from "@apollo/client/link/error";
import { relayStylePagination } from "@apollo/client/utilities";

type Handlers = {
  // ログインが切れていたとき
  onUnauthenticated: () => void;
  // それ以外の、使う人には直せない失敗（通信が切れた・サーバーのエラー）
  onFailure: (message: string) => void;
};

// リクエスト全体のエラー（GraphQL の errors・通信の失敗）は、ここの1か所で受ける。
// 使う人が直せるエラー（mutation の結果の errors）は、ここには来ない。各フォームが出す
function errorLink({ onUnauthenticated, onFailure }: Handlers) {
  // ErrorLink は、ここで返した値を「やり直した結果」として扱う。やり直さないので、何も返さない
  return new ErrorLink(({ error }) => {
    handle(error);
  });

  function handle(error: unknown): void {
    if (!CombinedGraphQLErrors.is(error)) {
      onFailure("通信に失敗しました。接続を確かめて、もう一度試してください");
      return;
    }
    const codes = error.errors.map((each) => each.extensions?.code);
    if (codes.includes("UNAUTHENTICATED")) onUnauthenticated();
    else if (codes.includes("NOT_FOUND")) onFailure("見つかりませんでした");
    else onFailure("サーバーでエラーが起きました。時間をおいて、もう一度試してください");
  }
}

export function makeApolloClient(handlers: Handlers, uri = "/graphql") {
  return new ApolloClient({
    link: ApolloLink.from([errorLink(handlers), new HttpLink({ uri, credentials: "same-origin" })]),
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            // 続きの読み込み（fetchMore）で来たページを、前のページの後ろにつなぐ。
            // 引数のうち、絞り込みが違えば別の一覧として持ち、first・after が違っても同じ一覧として持つ
            appointments: relayStylePagination(["filter", "descending"]),
            availableSlots: relayStylePagination(["clinicId", "doctorId", "from", "to"]),
            auditLogs: relayStylePagination(),
          },
        },
      },
    }),
  });
}
