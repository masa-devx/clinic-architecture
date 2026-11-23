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

// 続きを読み込む一覧（Query の項目）と、その一覧を分ける引数。
// 引数のうち、ここに挙げたもの（絞り込み）が違えば別の一覧として持ち、first・after が違っても同じ一覧として持つ
export type PaginatedFields = Record<string, readonly string[]>;

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

export function makeApolloClient(handlers: Handlers, paginated: PaginatedFields, uri = "/graphql") {
  const fields = Object.fromEntries(
    Object.entries(paginated).map(([field, keyArgs]) => [field, relayStylePagination([...keyArgs])]),
  );
  return new ApolloClient({
    // fragment の中身は、その fragment を持つ部品だけが useFragment で読む（親の部品には見えない）。
    // 画面自身が読む fragment は、クエリの側で @unmask を付ける。型は、各アプリの types/apollo-client.d.ts で合わせる
    dataMasking: true,
    // ブラウザは、画面と同じオリジンの /graphql に送る。Next.js が、そのアプリの入口（/graphql/patient など）へ中継する
    link: ApolloLink.from([errorLink(handlers), new HttpLink({ uri, credentials: "same-origin" })]),
    cache: new InMemoryCache({ typePolicies: { Query: { fields } } }),
  });
}
